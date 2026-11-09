import { useCallback, useEffect, useRef, useState } from "react";
import type { RetroApiClient } from "@retro/api-client";
import type { RetroRealtimeClient } from "@retro/realtime-client";
import type { ConversationDto, MessageDto } from "@retro/contracts";
import { ClientOutboxManager } from "@retro/chat-core";
import { localDb } from "../storage/indexedDbAdapter";

function mergeMessages(
  current: MessageDto[],
  incoming: MessageDto[],
): MessageDto[] {
  const byId = new Map(current.map(item => [item.id, item]));
  for (const message of incoming) {
    byId.set(message.id, message);
  }
  return [...byId.values()].sort((a, b) => a.sequence - b.sequence);
}

export function useConversations(
  api: RetroApiClient,
  realtime: RetroRealtimeClient,
  userId: string | undefined,
  isOnline: boolean,
  onPlayMessageSound: () => void,
  onPlayBuzzSound: () => void,
) {
  const outbox = useRef(new ClientOutboxManager()).current;
  const [conversations, setConversations] = useState<ConversationDto[]>([]);
  const [active, setActive] = useState<ConversationDto | null>(null);
  const activeRef = useRef<ConversationDto | null>(null);
  const [messages, setMessages] = useState<MessageDto[]>([]);
  const messagesRef = useRef<MessageDto[]>([]);
  const [outboxHydrated, setOutboxHydrated] = useState(false);
  const flushInProgressRef = useRef(false);

  const [isBuzzing, setIsBuzzing] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSentRef = useRef<number>(0);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Hydrate outbox from IndexedDB
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    setOutboxHydrated(false);
    void localDb.getOutbox(userId).then(entries => {
      if (cancelled) return;
      outbox.hydrate(entries);
      setOutboxHydrated(true);
    });
    return () => {
      cancelled = true;
    };
  }, [userId, outbox]);

  const loadConversations = useCallback(async () => {
    try {
      const items = await api.listConversations();
      setConversations(items);
      return items;
    } catch {
      return [];
    }
  }, [api]);

  // Flush Outbox messages
  const flushOutbox = useCallback(async () => {
    if (!isOnline || !outboxHydrated || !userId || flushInProgressRef.current) return;
    flushInProgressRef.current = true;
    try {
      const pending = outbox.getPending();
      for (const entry of pending) {
        try {
          const response = await api.sendMessage(
            entry.conversationId,
            entry.clientMessageId,
            entry.content,
          );
          outbox.markAcknowledged(entry.clientMessageId);
          await localDb.saveOutbox(userId, outbox.getAll());

          const cached = await localDb.getMessages(userId, entry.conversationId);
          const nextCached = mergeMessages(cached, [response.message]);
          await localDb.saveMessages(userId, nextCached);

          if (activeRef.current?.id === entry.conversationId) {
            setMessages(current => {
              const merged = mergeMessages(current, [response.message]);
              messagesRef.current = merged;
              return merged;
            });
          }
        } catch {
          outbox.markFailed(entry.clientMessageId);
          await localDb.saveOutbox(userId, outbox.getAll());
        }
      }
    } finally {
      flushInProgressRef.current = false;
    }
  }, [api, isOnline, outbox, outboxHydrated, userId]);

  // Load active conversation messages from IndexedDB + Remote delta sync
  useEffect(() => {
    if (!active || !userId) {
      setMessages([]);
      return;
    }

    let cancelled = false;
    void (async () => {
      const cached = await localDb.getMessages(userId, active.id);
      if (cancelled) return;
      setMessages(cached);
      messagesRef.current = cached;

      try {
        const latestSequence = cached.reduce(
          (max, item) => Math.max(max, item.sequence),
          0,
        );
        const remote = await api.listMessages(active.id, latestSequence);
        if (cancelled) return;

        const merged = mergeMessages(cached, remote);
        setMessages(merged);
        messagesRef.current = merged;
        await localDb.saveMessages(userId, merged);
      } catch {
        // Fall back to cached
      }
    })();
  }, [active, api, userId]);

  // Subscribe to SignalR events
  useEffect(() => {
    if (!userId) return;

    const unsubMsg = realtime.onMessage(message => {
      setMessages(current => {
        const merged = mergeMessages(current, [message]);
        messagesRef.current = merged;
        void localDb.saveMessages(userId, merged);
        return merged;
      });
      if (message.senderId !== userId) {
        onPlayMessageSound();
      }
    });

    const unsubBuzz = realtime.onBuzz((convId) => {
      if (activeRef.current?.id === convId) {
        setIsBuzzing(true);
        onPlayBuzzSound();
        setTimeout(() => setIsBuzzing(false), 600);
      }
    });

    const unsubTyping = realtime.onTyping((convId, uId, typing) => {
      if (activeRef.current?.id === convId && uId !== userId) {
        setIsTyping(typing);
        if (typing) {
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 5000);
        }
      }
    });

    return () => {
      unsubMsg();
      unsubBuzz();
      unsubTyping();
    };
  }, [onPlayBuzzSound, onPlayMessageSound, realtime, userId]);

  // Subscribe to active conversation in SignalR
  useEffect(() => {
    if (!active) return;
    void realtime.subscribeConversation(active.id);
  }, [active, realtime]);

  // Send message
  const sendMessage = useCallback(
    async (content: string) => {
      if (!active || !userId || !content.trim()) return;

      const clientMessageId = crypto.randomUUID();
      const optimisticMessage: MessageDto = {
        id: clientMessageId,
        conversationId: active.id,
        senderId: userId,
        clientMessageId,
        sequence: (messagesRef.current[messagesRef.current.length - 1]?.sequence ?? 0) + 1,
        type: 1,
        content: content.trim(),
        createdAt: new Date().toISOString(),
        editedAt: null,
        deletedAt: null,
      };

      setMessages(current => {
        const merged = mergeMessages(current, [optimisticMessage]);
        messagesRef.current = merged;
        return merged;
      });

      if (!isOnline) {
        outbox.enqueue(active.id, content.trim(), clientMessageId);
        await localDb.saveOutbox(userId, outbox.getAll());
        return;
      }

      try {
        const response = await api.sendMessage(
          active.id,
          clientMessageId,
          content.trim(),
        );
        const nextCached = mergeMessages(messagesRef.current, [response.message]);
        setMessages(nextCached);
        messagesRef.current = nextCached;
        await localDb.saveMessages(userId, nextCached);
      } catch {
        outbox.enqueue(active.id, content.trim(), clientMessageId);
        await localDb.saveOutbox(userId, outbox.getAll());
      }
    },
    [active, api, isOnline, outbox, userId],
  );

  // Send buzz
  const triggerBuzz = useCallback(async () => {
    if (!active) return;
    setIsBuzzing(true);
    onPlayBuzzSound();
    setTimeout(() => setIsBuzzing(false), 600);

    try {
      await realtime.sendBuzz(active.id);
    } catch {
      // Offline fallback
    }
  }, [active, onPlayBuzzSound, realtime]);

  // Handle typing notification
  const notifyTyping = useCallback(() => {
    if (!active) return;
    const now = Date.now();
    if (now - lastTypingSentRef.current > 3000) {
      lastTypingSentRef.current = now;
      void realtime.startTyping(active.id);
      setTimeout(() => {
        void realtime.stopTyping(active.id);
      }, 4000);
    }
  }, [active, realtime]);

  return {
    conversations,
    setConversations,
    active,
    setActive,
    messages,
    setMessages,
    loadConversations,
    flushOutbox,
    sendMessage,
    triggerBuzz,
    notifyTyping,
    isBuzzing,
    isTyping,
  };
}

