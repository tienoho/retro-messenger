import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState, Vibration } from "react-native";
import { isRefreshTokenRejected, RetroApiClient } from "@retro/api-client";
import { RetroRealtimeClient } from "@retro/realtime-client";
import type {
  CallEndedEvent,
  CallStartedEvent,
  MessageDto,
  SessionDto,
} from "@retro/contracts";
import { secureTokenStore } from "../native/secure-storage";
import { MobileSessionController } from "../session/mobile-session";

const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? "http://10.0.2.2:5080";

export interface UseMobileChatResult {
  session: SessionDto | null;
  conversationId: string | null;
  messages: MessageDto[];
  draft: string;
  booting: boolean;
  busy: boolean;
  error: string | null;
  isBuzzing: boolean;
  typingUsers: Set<string>;
  activeCall: CallStartedEvent | null;
  setDraft: (draft: string) => void;
  login: (username: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  send: (customContent?: string) => Promise<void>;
  sendBuzz: () => Promise<void>;
  startCall: (type?: "audio" | "video") => Promise<void>;
  endCall: () => Promise<void>;
}

export function useMobileChat(): UseMobileChatResult {
  const api = useMemo(() => new RetroApiClient(apiUrl), []);
  const sessions = useMemo(
    () => new MobileSessionController(api, secureTokenStore),
    [api],
  );

  const realtimeUrl = useMemo(
    () => `${apiUrl.replace(/\/$/, "")}/realtime`,
    [],
  );
  const realtime = useMemo(
    () =>
      new RetroRealtimeClient(realtimeUrl, async () => api.getAccessToken()),
    [api, realtimeUrl],
  );

  const [session, setSession] = useState<SessionDto | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageDto[]>([]);
  const [draft, setDraft] = useState("");
  const [booting, setBooting] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBuzzing, setIsBuzzing] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [activeCall, setActiveCall] = useState<CallStartedEvent | null>(null);

  const conversationIdRef = useRef<string | null>(null);
  conversationIdRef.current = conversationId;

  const currentUserIdRef = useRef<string | null>(null);
  currentUserIdRef.current = session?.user.id ?? null;

  const loadWorkspace = useCallback(async (): Promise<void> => {
    const conversations = await api.listConversations();
    const first = conversations[0] ?? null;
    setConversationId(first?.id ?? null);
    setMessages(first ? await api.listMessages(first.id) : []);
  }, [api]);

  // Realtime listeners
  useEffect(() => {
    const unsubMsg = realtime.onMessage((message: MessageDto) => {
      if (message.conversationId === conversationIdRef.current) {
        setMessages((current) => {
          if (current.some((m) => m.id === message.id)) return current;
          return [...current, message].sort(
            (left, right) => left.sequence - right.sequence,
          );
        });
      }
    });

    const unsubBuzz = realtime.onBuzz(
      (convId: string, _senderId: string) => {
        if (convId === conversationIdRef.current) {
          try {
            Vibration.vibrate([0, 200, 100, 200]);
          } catch {
            // ignore if vibration not permitted
          }
          setIsBuzzing(true);
          setTimeout(() => setIsBuzzing(false), 600);
        }
      },
    );

    const unsubTyping = realtime.onTyping(
      (convId: string, userId: string, isTyping: boolean) => {
        if (convId === conversationIdRef.current) {
          setTypingUsers((prev) => {
            const next = new Set(prev);
            if (isTyping) next.add(userId);
            else next.delete(userId);
            return next;
          });
        }
      },
    );

    const unsubCallStarted = realtime.onCallStarted((event: CallStartedEvent) => {
      if (event.callerId !== currentUserIdRef.current) {
        try {
          Vibration.vibrate([0, 300, 200, 300]);
        } catch {
          // ignore
        }
        setActiveCall(event);
      }
    });

    const unsubCallEnded = realtime.onCallEnded((_event: CallEndedEvent) => {
      setActiveCall(null);
    });

    return () => {
      unsubMsg();
      unsubBuzz();
      unsubTyping();
      unsubCallStarted();
      unsubCallEnded();
    };
  }, [realtime]);

  // Connect realtime when authenticated
  useEffect(() => {
    if (session) {
      void realtime.start().then(() => {
        if (conversationId) {
          void realtime.subscribeConversation(conversationId);
        }
      });
    } else {
      void realtime.stop();
    }
  }, [conversationId, realtime, session]);

  // Restore session on mount
  useEffect(() => {
    let cancelled = false;
    void sessions
      .restore()
      .then(async (response) => {
        if (cancelled || !response) return;
        setSession({ user: response.user });
        await loadWorkspace();
      })
      .catch((caught: unknown) => {
        if (!cancelled) {
          setError(
            isRefreshTokenRejected(caught)
              ? "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
              : "Chưa thể kết nối. Phiên an toàn vẫn được giữ trên thiết bị.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setBooting(false);
      });

    return () => {
      cancelled = true;
    };
  }, [loadWorkspace, sessions]);

  // AppState refresh
  useEffect(() => {
    if (!session) return;
    let refreshing = false;
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active" || refreshing) return;
      refreshing = true;
      void sessions
        .refresh()
        .then(async (response) => {
          setSession({ user: response.user });
          await loadWorkspace();
          setError(null);
        })
        .catch((caught: unknown) => {
          if (isRefreshTokenRejected(caught)) {
            setSession(null);
            setConversationId(null);
            setMessages([]);
          }
          setError(
            isRefreshTokenRejected(caught)
              ? "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
              : "Đang ngoại tuyến. Tin nhắn đã tải vẫn được giữ lại.",
          );
        })
        .finally(() => {
          refreshing = false;
        });
    });
    return () => subscription.remove();
  }, [loadWorkspace, session, sessions]);

  async function login(user: string, pass: string): Promise<void> {
    if (!user.trim() || !pass) return;
    setBusy(true);
    setError(null);
    try {
      const response = await sessions.login(user.trim(), pass);
      setSession({ user: response.user });
      await loadWorkspace();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Không thể đăng nhập. Vui lòng kiểm tra tài khoản.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function logout(): Promise<void> {
    setBusy(true);
    try {
      await sessions.logout();
    } finally {
      setSession(null);
      setConversationId(null);
      setMessages([]);
      setBusy(false);
    }
  }

  async function send(customContent?: string): Promise<void> {
    const content = customContent ?? draft.trim();
    if (!content || !conversationId) return;

    if (!customContent) {
      setDraft("");
    }
    const clientMessageId = `mobile-${Date.now()}`;
    try {
      const response = await api.sendMessage(
        conversationId,
        clientMessageId,
        content,
      );
      setMessages((current) =>
        [
          ...current.filter((item) => item.id !== response.message.id),
          response.message,
        ].sort((left, right) => left.sequence - right.sequence),
      );
    } catch (caught) {
      if (!customContent) {
        setDraft(content);
      }
      setError(
        caught instanceof Error ? caught.message : "Không thể gửi tin nhắn.",
      );
    }
  }

  async function sendBuzz(): Promise<void> {
    if (!conversationId) return;
    try {
      await realtime.sendBuzz(conversationId);
      await send("BUZZ!!!");
    } catch {
      await send("BUZZ!!!");
    }
  }

  async function startCall(type: "audio" | "video" = "audio"): Promise<void> {
    if (!conversationId) return;
    try {
      await realtime.startCall(conversationId, type);
    } catch (err) {
      console.warn("Mobile startCall failed:", err);
    }
  }

  async function endCall(): Promise<void> {
    if (!conversationId) return;
    try {
      await realtime.endCall(conversationId);
    } catch (err) {
      console.warn("Mobile endCall failed:", err);
    } finally {
      setActiveCall(null);
    }
  }

  return {
    session,
    conversationId,
    messages,
    draft,
    booting,
    busy,
    error,
    isBuzzing,
    typingUsers,
    activeCall,
    setDraft,
    login,
    logout,
    send,
    sendBuzz,
    startCall,
    endCall,
  };
}
