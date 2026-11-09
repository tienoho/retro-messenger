import { useEffect, useRef, useState, type FormEvent } from "react";
import type {
  ConversationDto,
  DesktopTransferProgress,
  MessageDto,
} from "@retro/contracts";
import type { DesktopOutboxEntry } from "../../shared/ipc-contracts.ts";
import { mergeMessages } from "../utils/desktop-messages";

export interface UseDesktopConversationsResult {
  conversations: ConversationDto[];
  active: ConversationDto | null;
  messages: MessageDto[];
  outbox: DesktopOutboxEntry[];
  draft: string;
  typingUsers: Set<string>;
  transfer: DesktopTransferProgress | null;
  lastBuzzAt: number;
  isBuzzing: boolean;
  openConversation: (conversation: ConversationDto) => Promise<void>;
  send: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  sendCustomMessage: (content: string) => Promise<void>;
  changeDraft: (value: string) => void;
  sendBuzz: () => Promise<void>;
  attach: () => Promise<void>;
  downloadAttachment: (attachmentId: string, fileName: string) => Promise<void>;
  refreshOutbox: () => Promise<void>;
  clearLocalData: () => Promise<void>;
  loadConversations: () => Promise<ConversationDto[]>;
  resetConversations: () => void;
}

export interface DesktopAudioHandlers {
  playMessageSound?: (() => void) | undefined;
  playSentSound?: (() => void) | undefined;
  playBuzzSound?: (() => void) | undefined;
}

export function useDesktopConversations(
  onError?: ((message: string) => void) | undefined,
  audio?: DesktopAudioHandlers | undefined,
): UseDesktopConversationsResult {
  const [conversations, setConversations] = useState<ConversationDto[]>([]);
  const [active, setActive] = useState<ConversationDto | null>(null);
  const activeRef = useRef<ConversationDto | null>(null);
  const [messages, setMessages] = useState<MessageDto[]>([]);
  const [outbox, setOutbox] = useState<DesktopOutboxEntry[]>([]);
  const [draft, setDraft] = useState("");
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const typingTimer = useRef<number | null>(null);
  const typingStarted = useRef(false);
  const typingExpiry = useRef(new Map<string, number>());
  const [transfer, setTransfer] = useState<DesktopTransferProgress | null>(null);
  const [lastBuzzAt, setLastBuzzAt] = useState(0);
  const [isBuzzing, setIsBuzzing] = useState(false);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  async function refreshOutbox(): Promise<void> {
    setOutbox(await window.retroDesktop.listOutbox());
  }

  async function openConversation(
    conversation: ConversationDto,
  ): Promise<void> {
    const previous = activeRef.current;
    if (previous && previous.id !== conversation.id && typingStarted.current) {
      void window.retroDesktop.stopTyping({ conversationId: previous.id });
      typingStarted.current = false;
    }
    setActive(conversation);
    void window.retroDesktop.setActiveConversation({
      conversationId: conversation.id,
    });
    try {
      const [nextMessages, nextOutbox] = await Promise.all([
        window.retroDesktop.listMessages({ conversationId: conversation.id }),
        window.retroDesktop.listOutbox(),
      ]);
      setMessages(nextMessages);
      setOutbox(nextOutbox);
    } catch (caught) {
      onError?.(
        caught instanceof Error
          ? caught.message
          : "Không thể tải cuộc trò chuyện.",
      );
    }
  }

  async function loadConversations(): Promise<ConversationDto[]> {
    const items = await window.retroDesktop.listConversations();
    setConversations(items);
    const first = items[0] ?? null;
    if (first) {
      await openConversation(first);
    }
    return items;
  }

  useEffect(() => {
    const receive = (message: MessageDto) => {
      if (activeRef.current?.id === message.conversationId) {
        setMessages((current) => mergeMessages(current, [message]));
      }
      setOutbox((current) =>
        current.filter(
          (entry) => entry.clientMessageId !== message.clientMessageId,
        ),
      );
    };

    const unsubscribers = [
      window.retroDesktop.onMessageSent((msg) => {
        audio?.playSentSound?.();
        receive(msg);
      }),
      window.retroDesktop.onRealtimeMessage((msg) => {
        if (msg.content === "BUZZ!!!" || msg.content === "(BUZZ)") {
          audio?.playBuzzSound?.();
        } else {
          audio?.playMessageSound?.();
        }
        receive(msg);
      }),
      window.retroDesktop.onTypingChanged((event) => {
        if (event.conversationId !== activeRef.current?.id) return;
        window.clearTimeout(typingExpiry.current.get(event.userId));
        setTypingUsers((current) => {
          const next = new Set(current);
          if (event.isTyping) {
            next.add(event.userId);
          } else {
            next.delete(event.userId);
          }
          return next;
        });
        if (event.isTyping) {
          const timeout = window.setTimeout(
            () =>
              setTypingUsers((current) => {
                const next = new Set(current);
                next.delete(event.userId);
                return next;
              }),
            6_000,
          );
          typingExpiry.current.set(event.userId, timeout);
        }
      }),
      window.retroDesktop.onBuzzReceived(() => {
        audio?.playBuzzSound?.();
        setLastBuzzAt(Date.now());
        setIsBuzzing(true);
        window.setTimeout(() => setIsBuzzing(false), 500);
      }),
      window.retroDesktop.onTransferProgress(setTransfer),
      window.retroDesktop.onNavigateConversation((conversationId) => {
        const target = conversations.find((item) => item.id === conversationId);
        if (target) void openConversation(target);
      }),
    ];

    return () => {
      for (const unsubscribe of unsubscribers) unsubscribe();
    };
  }, [conversations]);

  useEffect(() => {
    const stop = () => {
      if (activeRef.current && typingStarted.current) {
        void window.retroDesktop.stopTyping({
          conversationId: activeRef.current.id,
        });
        typingStarted.current = false;
      }
    };
    window.addEventListener("blur", stop);
    return () => {
      window.removeEventListener("blur", stop);
      stop();
    };
  }, []);

  function changeDraft(value: string): void {
    setDraft(value);
    if (!active) return;
    if (!typingStarted.current && value.trim()) {
      typingStarted.current = true;
      void window.retroDesktop.startTyping({ conversationId: active.id });
    }
    if (typingTimer.current) window.clearTimeout(typingTimer.current);
    typingTimer.current = window.setTimeout(() => {
      if (activeRef.current && typingStarted.current) {
        typingStarted.current = false;
        void window.retroDesktop.stopTyping({
          conversationId: activeRef.current.id,
        });
      }
    }, 1_500);
  }

  async function send(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const content = draft.trim();
    if (!active || !content) return;
    setDraft("");
    if (typingStarted.current) {
      typingStarted.current = false;
      void window.retroDesktop.stopTyping({ conversationId: active.id });
    }
    try {
      await window.retroDesktop.enqueueMessage({
        conversationId: active.id,
        clientMessageId: crypto.randomUUID(),
        content,
      });
      await refreshOutbox();
    } catch (caught) {
      setDraft(content);
      onError?.(
        caught instanceof Error
          ? caught.message
          : "Không thể xếp hàng tin nhắn.",
      );
    }
  }

  async function sendBuzz(): Promise<void> {
    if (!active || Date.now() - lastBuzzAt < 10_000) return;
    setLastBuzzAt(Date.now());
    setIsBuzzing(true);
    audio?.playBuzzSound?.();
    window.setTimeout(() => setIsBuzzing(false), 500);
    try {
      await window.retroDesktop.sendBuzz({ conversationId: active.id });
    } catch (caught) {
      onError?.(
        caught instanceof Error ? caught.message : "Không thể gửi Buzz.",
      );
    }
  }

  async function sendCustomMessage(content: string): Promise<void> {
    const text = content.trim();
    if (!active || !text) return;
    try {
      await window.retroDesktop.enqueueMessage({
        conversationId: active.id,
        clientMessageId: crypto.randomUUID(),
        content: text,
      });
      await refreshOutbox();
    } catch (caught) {
      onError?.(
        caught instanceof Error
          ? caught.message
          : "Không thể xếp hàng tin nhắn.",
      );
    }
  }

  async function attach(): Promise<void> {
    if (!active) return;
    try {
      const result = await window.retroDesktop.selectAndUploadAttachment({
        conversationId: active.id,
      });
      if (result?.attachmentId && result.state === "completed") {
        await window.retroDesktop.enqueueMessage({
          conversationId: active.id,
          clientMessageId: crypto.randomUUID(),
          content: `[attachment:${result.attachmentId}] ${result.fileName}`,
        });
        await refreshOutbox();
      }
    } catch (caught) {
      onError?.(
        caught instanceof Error ? caught.message : "Không thể tải tệp lên.",
      );
    }
  }

  async function downloadAttachment(
    attachmentId: string,
    fileName: string,
  ): Promise<void> {
    try {
      await window.retroDesktop.downloadAttachment({
        attachmentId,
        fileName,
      });
    } catch (caught) {
      onError?.(
        caught instanceof Error ? caught.message : "Không thể tải tệp về.",
      );
    }
  }

  async function clearLocalData(): Promise<void> {
    await window.retroDesktop.clearLocalData();
    setMessages([]);
    setOutbox([]);
  }

  function resetConversations(): void {
    setConversations([]);
    setActive(null);
    setMessages([]);
    setOutbox([]);
    setDraft("");
  }

  return {
    conversations,
    active,
    messages,
    outbox,
    draft,
    typingUsers,
    transfer,
    lastBuzzAt,
    isBuzzing,
    openConversation,
    send,
    sendCustomMessage,
    changeDraft,
    sendBuzz,
    attach,
    downloadAttachment,
    refreshOutbox,
    clearLocalData,
    loadConversations,
    resetConversations,
  };
}

