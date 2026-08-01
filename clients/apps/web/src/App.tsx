import {
  useEffect,
  useCallback,
  useMemo,
  useState,
  useRef,
  type FormEvent,
} from "react";
import { RetroApiClient } from "@retro/api-client";
import { mergeMessages, ClientOutboxManager } from "@retro/chat-core";
import type {
  ConversationDto,
  MessageDto,
  SessionDto,
} from "@retro/contracts";
import { RetroRealtimeClient } from "@retro/realtime-client";
import { localDb } from "./storage/indexedDbAdapter";
import { useLiveKitCall } from "./features/calls";
import { CallOverlay } from "./widgets/call-overlay";
import {
  useAttachmentUpload,
  AttachmentPicker,
  AttachmentPreviewCard,
} from "./features/attachments";

const apiBase = import.meta.env.VITE_API_URL ?? "";
const realtimeUrl =
  import.meta.env.VITE_REALTIME_URL ??
  `${window.location.protocol}//${window.location.host}/realtime`;

const attachmentLinePattern = /^\[attachment:([0-9a-f-]{36})\]\s+(.+)$/i;

function MessageContent({
  content,
  onDownloadAttachment,
}: {
  content: string;
  onDownloadAttachment: (attachmentId: string) => void;
}) {
  return (
    <div className="messageContent">
      {content.split("\n").map((line, index) => {
        const attachment = attachmentLinePattern.exec(line);
        return attachment ? (
          <button
            type="button"
            className="attachmentDownloadBtn"
            key={`${attachment[1]}-${index}`}
            onClick={() => onDownloadAttachment(attachment[1]!)}
          >
            📎 {attachment[2]}
          </button>
        ) : (
          <span key={`${line}-${index}`}>{line}</span>
        );
      })}
    </div>
  );
}

export function App() {
  const api = useMemo(() => new RetroApiClient(apiBase), []);
  const realtime = useMemo(
    () => new RetroRealtimeClient(realtimeUrl, async () => api.getAccessToken()),
    [api],
  );
  const outbox = useMemo(() => new ClientOutboxManager(), []);

  const [authenticated, setAuthenticated] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authenticating, setAuthenticating] = useState(false);
  const [session, setSession] = useState<SessionDto | null>(null);
  const [conversations, setConversations] = useState<ConversationDto[]>([]);
  const [active, setActive] = useState<ConversationDto | null>(null);
  const [messages, setMessages] = useState<MessageDto[]>([]);
  const [outboxHydrated, setOutboxHydrated] = useState(false);
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState("connecting");
  const [userStatus, setUserStatus] = useState("online");
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isBuzzing, setIsBuzzing] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const flushInProgressRef = useRef(false);
  const messagesRef = useRef<MessageDto[]>([]);
  const activeRef = useRef<ConversationDto | null>(null);
  const syncActiveMessagesRef = useRef<() => Promise<void>>(async () => {});
  const flushOutboxRef = useRef<() => Promise<void>>(async () => {});

  const call = useLiveKitCall(api, realtime, session?.user.id);
  const {
    attachments,
    isUploading,
    uploadError,
    uploadFile,
    removeAttachment,
    clearAttachments,
  } = useAttachmentUpload(api);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    if (!authenticated || !session) return;

    let cancelled = false;
    setOutboxHydrated(false);
    void localDb.getOutbox(session.user.id).then(entries => {
      if (cancelled) return;
      outbox.hydrate(entries);
      setOutboxHydrated(true);
    });

    return () => {
      cancelled = true;
    };
  }, [authenticated, session, outbox]);

  useEffect(() => {
    if (!authenticated) return;

    void (async () => {
      try {
        const [nextSession, items] = await Promise.all([
          api.getSession(),
          api.listConversations(),
        ]);
        setSession(nextSession);
        setUserStatus(nextSession.user.status);
        setConversations(items);
        setActive(items[0] ?? null);
      } catch {
        if (!api.getAccessToken()) {
          setAuthenticated(false);
          setAuthError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        }
      }
    })();
  }, [api, authenticated]);

  const syncActiveMessages = useCallback(async () => {
    if (!active || !session) return;

    const latestSequence = messagesRef.current
      .filter(message => message.conversationId === active.id)
      .reduce((maximum, message) => Math.max(maximum, message.sequence), 0);
    const remote = await api.listMessages(
      active.id,
      latestSequence > 0 ? latestSequence : undefined,
    );

    setMessages(current => {
      const merged = mergeMessages(current, remote);
      messagesRef.current = merged;
      void localDb.saveMessages(session.user.id, merged);
      return merged;
    });
  }, [active, api, session]);

  const flushOutbox = useCallback(async () => {
    if (
      !authenticated ||
      !isOnline ||
      !outboxHydrated ||
      !session ||
      flushInProgressRef.current
    ) {
      return;
    }

    flushInProgressRef.current = true;
    try {
      for (const entry of outbox.getPending()) {
        outbox.markSending(entry.clientMessageId);
        await localDb.saveOutbox(session.user.id, outbox.getAll());

        try {
          const response = await api.sendMessage(
            entry.conversationId,
            entry.clientMessageId,
            entry.content,
          );
          outbox.markAcknowledged(entry.clientMessageId);

          const cached = await localDb.getMessages(
            session.user.id,
            entry.conversationId,
          );
          await localDb.saveMessages(
            session.user.id,
            mergeMessages(cached, [response.message]),
          );

          if (active?.id === entry.conversationId) {
            setMessages(current => mergeMessages(current, [response.message]));
          }
        } catch {
          outbox.markFailed(entry.clientMessageId);
        }

        await localDb.saveOutbox(session.user.id, outbox.getAll());
      }
    } finally {
      flushInProgressRef.current = false;
    }
  }, [active, api, authenticated, isOnline, outbox, outboxHydrated, session]);

  useEffect(() => {
    syncActiveMessagesRef.current = syncActiveMessages;
    flushOutboxRef.current = flushOutbox;
  }, [flushOutbox, syncActiveMessages]);

  useEffect(() => {
    if (!active || !session) return;

    void (async () => {
      const local = await localDb.getMessages(session.user.id, active.id);
      if (local.length > 0) {
        messagesRef.current = local;
        setMessages(local);
      }

      try {
        const latestSequence = local.reduce(
          (maximum, message) => Math.max(maximum, message.sequence),
          0,
        );
        const remote = await api.listMessages(
          active.id,
          latestSequence > 0 ? latestSequence : undefined,
        );
        setMessages(current => {
          const merged = mergeMessages(current, remote);
          messagesRef.current = merged;
          void localDb.saveMessages(session.user.id, merged);
          return merged;
        });
      } catch {
        // Use local cache if offline
      }
    })();
  }, [active, api, session]);

  useEffect(() => {
    if (!authenticated || !session) return;

    let cancelled = false;
    const userId = session.user.id;

    const unsubMsg = realtime.onMessage(message => {
      setMessages(current => {
        const merged = mergeMessages(current, [message]);
        messagesRef.current = merged;
        void localDb.saveMessages(userId, merged);
        return merged;
      });
    });

    const unsubBuzz = realtime.onBuzz((convId) => {
      if (activeRef.current?.id === convId) {
        setIsBuzzing(true);
        setTimeout(() => setIsBuzzing(false), 1200);
      }
    });

    const unsubTyping = realtime.onTyping((convId, _userId, typing) => {
      if (activeRef.current?.id === convId) {
        setIsTyping(typing);
      }
    });

    const unsubReconnect = realtime.onReconnected(() => {
      void (async () => {
        if (cancelled) return;
        setStatus("online");
        const currentActive = activeRef.current;
        if (currentActive) {
          await realtime.subscribeConversation(currentActive.id);
          await syncActiveMessagesRef.current();
        }
        await flushOutboxRef.current();
      })();
    });

    void realtime
      .start()
      .then(async () => {
        if (cancelled) return;
        setStatus("online");
        await flushOutboxRef.current();
      })
      .catch(() => {
        if (!cancelled) setStatus("offline");
      });

    return () => {
      cancelled = true;
      unsubMsg();
      unsubBuzz();
      unsubTyping();
      unsubReconnect();
      void realtime.stop();
    };
  }, [authenticated, realtime, session?.user.id]);

  useEffect(() => {
    if (!authenticated || !active || status !== "online") return;

    void realtime.subscribeConversation(active.id);
  }, [active, authenticated, realtime, status]);

  useEffect(() => {
    void flushOutbox();
  }, [flushOutbox]);

  async function handleAuthentication(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setAuthenticating(true);
    setAuthError(null);

    try {
      const response = authMode === "login"
        ? await api.login(username.trim(), password)
        : await api.register(username.trim(), displayName.trim(), password);

      setSession({ user: response.user });
      setUserStatus(response.user.status);
      setAuthenticated(true);
      setPassword("");
    } catch (error) {
      setAuthError(
        error instanceof Error
          ? error.message
          : "Không thể đăng nhập. Vui lòng thử lại.",
      );
    } finally {
      setAuthenticating(false);
    }
  }

  async function handleLogout(): Promise<void> {
    await realtime.stop();
    try {
      await api.logout();
    } catch {
      api.clearSession();
    }
    outbox.hydrate([]);
    setAuthenticated(false);
    setSession(null);
    setConversations([]);
    setActive(null);
    setMessages([]);
    setOutboxHydrated(false);
    setStatus("disconnected");
  }

  async function send(): Promise<void> {
    const contentText = draft.trim();
    const completedAttachments = attachments.filter(
      attachment => attachment.status === "completed" && attachment.id,
    );
    if ((!contentText && completedAttachments.length === 0) || !active || !session) return;

    let finalContent = contentText;
    if (completedAttachments.length > 0) {
      const attLinks = completedAttachments
        .map(attachment => `[attachment:${attachment.id}] ${attachment.fileName}`)
        .join("\n");
      finalContent = finalContent ? `${finalContent}\n${attLinks}` : attLinks;
      clearAttachments();
    }

    setDraft("");
    const clientMessageId = crypto.randomUUID();

    if (!isOnline) {
      outbox.enqueue(active.id, finalContent, clientMessageId);
      void localDb.saveOutbox(session.user.id, outbox.getAll());
      return;
    }

    try {
      const response = await api.sendMessage(
        active.id,
        clientMessageId,
        finalContent,
      );

      setMessages(current => {
        const merged = mergeMessages(current, [response.message]);
        messagesRef.current = merged;
        void localDb.saveMessages(session.user.id, merged);
        return merged;
      });
    } catch {
      outbox.enqueue(active.id, finalContent, clientMessageId);
      void localDb.saveOutbox(session.user.id, outbox.getAll());
    }
  }

  async function downloadAttachment(attachmentId: string): Promise<void> {
    setDownloadError(null);
    try {
      const response = await api.getAttachmentDownloadUrl(attachmentId);
      window.location.assign(response.downloadUrl);
    } catch (error) {
      setDownloadError(
        error instanceof Error ? error.message : "Không thể tải tệp đính kèm.",
      );
    }
  }

  async function triggerBuzz(): Promise<void> {
    if (!active) return;
    try {
      await realtime.sendBuzz(active.id);
      setIsBuzzing(true);
      setTimeout(() => setIsBuzzing(false), 1200);
    } catch {
      // Cooldown or error
    }
  }

  function handleDraftChange(value: string): void {
    setDraft(value);
    if (!active) return;

    void realtime.startTyping(active.id);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      void realtime.stopTyping(active.id);
    }, 3000);
  }

  async function handleStatusChange(newStatus: string): Promise<void> {
    setUserStatus(newStatus);
    try {
      await api.updateStatus(newStatus);
    } catch {
      // Offline fallback
    }
  }

  if (!authenticated) {
    return (
      <main className="authShell">
        <section className="authPanel" aria-labelledby="auth-title">
          <div className="authBrand" aria-hidden="true">R!</div>
          <p className="authEyebrow">RETRO MESSENGER</p>
          <h1 id="auth-title">
            {authMode === "login" ? "Chào mừng trở lại" : "Tạo tài khoản mới"}
          </h1>
          <p className="authIntro">
            Trò chuyện theo phong cách messenger cổ điển, trên nền tảng hiện đại.
          </p>

          <form className="authForm" onSubmit={event => void handleAuthentication(event)}>
            <label htmlFor="auth-username">Tên đăng nhập</label>
            <input
              id="auth-username"
              autoComplete="username"
              value={username}
              onChange={event => setUsername(event.target.value)}
              required
              minLength={3}
            />

            {authMode === "register" && (
              <>
                <label htmlFor="auth-display-name">Tên hiển thị</label>
                <input
                  id="auth-display-name"
                  autoComplete="name"
                  value={displayName}
                  onChange={event => setDisplayName(event.target.value)}
                  required
                />
              </>
            )}

            <label htmlFor="auth-password">Mật khẩu</label>
            <input
              id="auth-password"
              type="password"
              autoComplete={authMode === "login" ? "current-password" : "new-password"}
              value={password}
              onChange={event => setPassword(event.target.value)}
              required
              minLength={6}
            />

            {authError && <p className="authError" role="alert">{authError}</p>}

            <button className="authSubmit" type="submit" disabled={authenticating}>
              {authenticating
                ? "Đang kết nối…"
                : authMode === "login" ? "Đăng nhập" : "Đăng ký"}
            </button>
          </form>

          <button
            type="button"
            className="authSwitch"
            onClick={() => {
              setAuthMode(current => current === "login" ? "register" : "login");
              setAuthError(null);
            }}
          >
            {authMode === "login"
              ? "Chưa có tài khoản? Đăng ký"
              : "Đã có tài khoản? Đăng nhập"}
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className={`shell ${isBuzzing ? "bzzing" : ""}`}>
      {!isOnline && (
        <div className="offlineBanner">
          ⚡ Bạn đang ngoại tuyến (Offline). Các tin nhắn sẽ được lưu vào Hàng đợi Offline và gửi khi có mạng.
        </div>
      )}

      <aside className="sidebar">
        <header>
          <div className="avatar">
            {session?.user.displayName.slice(0, 1) ?? "R"}
          </div>
          <div>
            <strong>
              {session?.user.displayName ?? "Retro Messenger"}
            </strong>
            <select
              className="statusSelect"
              value={userStatus}
              onChange={e => void handleStatusChange(e.target.value)}
            >
              <option value="online">🟢 Online</option>
              <option value="busy">🔴 Busy</option>
              <option value="invisible">⚪ Invisible</option>
              <option value="offline">⚫ Offline</option>
            </select>
            <button type="button" className="logoutButton" onClick={() => void handleLogout()}>
              Đăng xuất
            </button>
          </div>
        </header>

        <input
          className="search"
          placeholder="Tìm cuộc trò chuyện"
        />

        {conversations.map(item => (
          <button
            className={`conversation ${
              active?.id === item.id ? "active" : ""
            }`}
            key={item.id}
            onClick={() => setActive(item)}
          >
            <span className="presence" />
            <span>{item.title}</span>
          </button>
        ))}
      </aside>

      <section className="chat">
        <div className="chatHeader">
          <div>
            <strong>
              {active?.title ?? "Chọn cuộc trò chuyện"}
            </strong>
            {isTyping ? (
              <small className="typingIndicator">✏️ Đối phương đang gõ phím...</small>
            ) : (
              <small>{status}</small>
            )}
          </div>
          <div className="headerCallBtns">
            <button
              type="button"
              className="headerCallBtn"
              title="Cuộc gọi thoại (Audio Call)"
              onClick={() => active && void call.startCall(active.id, "audio")}
            >
              ☎︎ Audio
            </button>
            <button
              type="button"
              className="headerCallBtn"
              title="Cuộc gọi video (Video Call)"
              onClick={() => active && void call.startCall(active.id, "video")}
            >
              ◉ Video
            </button>
          </div>
        </div>

        <div className="timeline">
          {messages.map(message => {
            const mine = message.senderId === session?.user.id;

            return (
              <article
                className={`bubbleRow ${mine ? "mine" : ""}`}
                key={message.id}
              >
                <div className="bubble">
                  <MessageContent
                    content={message.content}
                    onDownloadAttachment={attachmentId => void downloadAttachment(attachmentId)}
                  />
                  <small>#{message.sequence}</small>
                </div>
              </article>
            );
          })}
        </div>

        {attachments.length > 0 && (
          <div className="composerAttachments">
            {attachments.map(att => (
              <AttachmentPreviewCard
                key={att.id}
                attachment={att}
                onRemove={removeAttachment}
              />
            ))}
          </div>
        )}

        {(uploadError || downloadError) && (
          <p className="mediaError" role="alert">{uploadError ?? downloadError}</p>
        )}

        <div className="composer">
          <button
            className="buzzBtn"
            title="Gửi BUZZ! (Màn hình rung)"
            onClick={() => void triggerBuzz()}
          >
            ⚡ BUZZ!
          </button>
          <AttachmentPicker
            onFileSelect={file => active && void uploadFile(active.id, file)}
            disabled={isUploading || !active}
          />
          <textarea
            value={draft}
            onChange={event => handleDraftChange(event.target.value)}
            onKeyDown={event => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void send();
              }
            }}
            placeholder="Nhập tin nhắn..."
          />
          <button
            className="send"
            onClick={() => void send()}
          >
            Gửi
          </button>
        </div>
      </section>

      <CallOverlay
        callState={call.callState}
        callType={call.callType}
        callerName={call.callerName}
        isMuted={call.isMuted}
        isVideoOff={call.isVideoOff}
        onAccept={() => void call.acceptCall()}
        onDecline={() => void call.declineCall()}
        onLeave={() => void call.leaveCall()}
        onToggleMute={call.toggleMute}
        onToggleVideo={call.toggleVideo}
      />
    </main>
  );
}
