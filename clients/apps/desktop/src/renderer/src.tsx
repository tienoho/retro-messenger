import { useEffect, useRef, useState, type FormEvent } from "react";
import { createRoot } from "react-dom/client";
import type {
  BlockedContactDto,
  ContactRequestStateDto,
  ConversationDto,
  DesktopTransferProgress,
  DesktopUpdaterState,
  FriendDto,
  MessageDto,
} from "@retro/contracts";
import type {
  DesktopOutboxEntry,
  DesktopSessionState,
  RetroDesktopBridge,
} from "../shared/ipc-contracts.ts";
import "./style.css";

declare global {
  interface Window {
    retroDesktop: RetroDesktopBridge;
  }
}

const signedOut: DesktopSessionState = { authenticated: false, user: null };
const emptyRequests: ContactRequestStateDto = { incoming: [], outgoing: [] };
const attachmentPattern = /^📎 (.+)\nattachment:([0-9a-f-]{36})$/i;

function mergeMessages(
  current: MessageDto[],
  incoming: MessageDto[],
): MessageDto[] {
  const byId = new Map(current.map((message) => [message.id, message]));
  for (const message of incoming) byId.set(message.id, message);
  return [...byId.values()].sort(
    (left, right) => left.sequence - right.sequence,
  );
}

function App() {
  const [session, setSession] = useState<DesktopSessionState | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [conversations, setConversations] = useState<ConversationDto[]>([]);
  const [active, setActive] = useState<ConversationDto | null>(null);
  const activeRef = useRef<ConversationDto | null>(null);
  const [messages, setMessages] = useState<MessageDto[]>([]);
  const [outbox, setOutbox] = useState<DesktopOutboxEntry[]>([]);
  const [friends, setFriends] = useState<FriendDto[]>([]);
  const [requests, setRequests] =
    useState<ContactRequestStateDto>(emptyRequests);
  const [blocked, setBlocked] = useState<BlockedContactDto[]>([]);
  const [section, setSection] = useState<"chats" | "contacts">("chats");
  const [draft, setDraft] = useState("");
  const [friendUsername, setFriendUsername] = useState("");
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const typingTimer = useRef<number | null>(null);
  const typingStarted = useRef(false);
  const typingExpiry = useRef(new Map<string, number>());
  const [transfer, setTransfer] = useState<DesktopTransferProgress | null>(
    null,
  );
  const [updater, setUpdater] = useState<DesktopUpdaterState>({
    state: "idle",
  });
  const [lastBuzzAt, setLastBuzzAt] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  async function refreshOutbox(): Promise<void> {
    setOutbox(await window.retroDesktop.listOutbox());
  }

  async function loadContacts(): Promise<void> {
    const [nextFriends, nextRequests, nextBlocked] = await Promise.all([
      window.retroDesktop.listFriends(),
      window.retroDesktop.listContactRequests(),
      window.retroDesktop.listBlockedContacts(),
    ]);
    setFriends(nextFriends);
    setRequests(nextRequests);
    setBlocked(nextBlocked);
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
    setError(null);
    try {
      const [nextMessages, nextOutbox] = await Promise.all([
        window.retroDesktop.listMessages({ conversationId: conversation.id }),
        window.retroDesktop.listOutbox(),
      ]);
      setMessages(nextMessages);
      setOutbox(nextOutbox);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Không thể tải cuộc trò chuyện.",
      );
    }
  }

  async function loadWorkspace(): Promise<void> {
    const items = await window.retroDesktop.listConversations();
    setConversations(items);
    await Promise.allSettled([
      loadContacts(),
      window.retroDesktop.getUpdaterState().then(setUpdater),
    ]);
    const first = items[0] ?? null;
    if (first) await openConversation(first);
  }

  useEffect(() => {
    let cancelled = false;
    void window.retroDesktop.getSession().then(async (nextSession) => {
      if (cancelled) return;
      setSession(nextSession);
      if (nextSession.authenticated) {
        try {
          await loadWorkspace();
        } catch (caught) {
          if (!cancelled)
            setError(
              caught instanceof Error
                ? caught.message
                : "Không thể tải dữ liệu.",
            );
        }
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

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
      window.retroDesktop.onMessageSent(receive),
      window.retroDesktop.onRealtimeMessage(receive),
      window.retroDesktop.onTypingChanged((event) => {
        if (event.conversationId !== activeRef.current?.id) return;
        window.clearTimeout(typingExpiry.current.get(event.userId));
        setTypingUsers((current) => {
          const next = new Set(current);
          event.isTyping ? next.add(event.userId) : next.delete(event.userId);
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
      window.retroDesktop.onBuzzReceived(() => setLastBuzzAt(Date.now())),
      window.retroDesktop.onPresenceChanged((event) =>
        setFriends((current) =>
          current.map((friend) =>
            friend.userId === event.userId
              ? { ...friend, status: event.status }
              : friend,
          ),
        ),
      ),
      window.retroDesktop.onTransferProgress(setTransfer),
      window.retroDesktop.onUpdaterState(setUpdater),
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

  async function login(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const nextSession = await window.retroDesktop.login({
        username,
        password,
      });
      setSession(nextSession);
      setPassword("");
      await loadWorkspace();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Không thể đăng nhập.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function logout(): Promise<void> {
    setBusy(true);
    try {
      await window.retroDesktop.logout();
    } finally {
      setSession(signedOut);
      setConversations([]);
      setActive(null);
      setMessages([]);
      setOutbox([]);
      setFriends([]);
      setRequests(emptyRequests);
      setBlocked([]);
      setBusy(false);
    }
  }

  async function send(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const content = draft.trim();
    if (!active || !content) return;
    setDraft("");
    setError(null);
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
      setError(
        caught instanceof Error
          ? caught.message
          : "Không thể xếp hàng tin nhắn.",
      );
    }
  }

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

  async function sendBuzz(): Promise<void> {
    if (!active || Date.now() - lastBuzzAt < 10_000) return;
    setLastBuzzAt(Date.now());
    try {
      await window.retroDesktop.sendBuzz({ conversationId: active.id });
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Không thể gửi Buzz.",
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
          content: `📎 ${result.fileName}\nattachment:${result.attachmentId}`,
        });
        await refreshOutbox();
      }
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Không thể tải tệp lên.",
      );
    }
  }

  async function addFriend(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    try {
      await window.retroDesktop.sendFriendRequest({
        targetUsername: friendUsername,
      });
      setFriendUsername("");
      await loadContacts();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Không thể gửi lời mời.",
      );
    }
  }

  if (session === null)
    return <main className="loadingScreen">Đang khôi phục phiên an toàn…</main>;
  if (!session.authenticated || !session.user)
    return (
      <main className="authScreen">
        <section className="authPanel">
          <div className="brandMark">R!</div>
          <p className="eyebrow">RETRO MESSENGER</p>
          <h1>
            Trò chuyện như ngày xưa.
            <br />
            An toàn như hôm nay.
          </h1>
          <p className="authCopy">
            Phiên đăng nhập được mã hóa bởi hệ điều hành và không bao giờ đi vào
            trang hiển thị.
          </p>
          <form onSubmit={(event) => void login(event)}>
            <label>
              Tên đăng nhập
              <input
                autoComplete="username"
                maxLength={64}
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                required
              />
            </label>
            <label>
              Mật khẩu
              <input
                autoComplete="current-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <button className="primaryButton" disabled={busy} type="submit">
              {busy ? "Đang đăng nhập…" : "Đăng nhập"}
            </button>
          </form>
        </section>
      </main>
    );

  const pending = outbox.filter((entry) => entry.conversationId === active?.id);
  return (
    <main className="messengerShell">
      <aside className="sidebar">
        <div className="profile">
          <div className="avatar">
            {session.user.displayName.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <strong>{session.user.displayName}</strong>
            <select
              aria-label="Trạng thái"
              value={session.user.status}
              onChange={(event) =>
                void window.retroDesktop
                  .updateStatus({
                    status: event.target.value as
                      | "online"
                      | "away"
                      | "busy"
                      | "invisible",
                  })
                  .then(setSession)
              }
            >
              <option value="online">Trực tuyến</option>
              <option value="away">Vắng mặt</option>
              <option value="busy">Bận</option>
              <option value="invisible">Ẩn</option>
            </select>
          </div>
        </div>
        <div className="sectionTabs">
          <button
            className={section === "chats" ? "selected" : ""}
            onClick={() => setSection("chats")}
          >
            Trò chuyện
          </button>
          <button
            className={section === "contacts" ? "selected" : ""}
            onClick={() => setSection("contacts")}
          >
            Danh bạ
          </button>
        </div>
        {section === "chats" ? (
          <nav aria-label="Danh sách trò chuyện">
            {conversations.map((conversation) => (
              <button
                className={
                  conversation.id === active?.id
                    ? "conversation active"
                    : "conversation"
                }
                key={conversation.id}
                onClick={() => void openConversation(conversation)}
              >
                <span className="contactAvatar">
                  {conversation.title.slice(0, 1).toUpperCase()}
                </span>
                <span>{conversation.title}</span>
              </button>
            ))}
          </nav>
        ) : (
          <div className="contactsPanel">
            <form
              className="addFriend"
              onSubmit={(event) => void addFriend(event)}
            >
              <input
                aria-label="Tên người dùng"
                placeholder="Thêm bằng username"
                value={friendUsername}
                onChange={(event) => setFriendUsername(event.target.value)}
              />
              <button>+</button>
            </form>
            <h3>Trực tuyến</h3>
            {friends
              .filter((friend) => friend.status === "online")
              .map((friend) => (
                <ContactRow
                  key={friend.userId}
                  friend={friend}
                  onBlock={async () => {
                    await window.retroDesktop.blockContact({
                      userId: friend.userId,
                    });
                    await loadContacts();
                  }}
                />
              ))}
            <h3>Ngoại tuyến</h3>
            {friends
              .filter((friend) => friend.status !== "online")
              .map((friend) => (
                <ContactRow
                  key={friend.userId}
                  friend={friend}
                  onBlock={async () => {
                    await window.retroDesktop.blockContact({
                      userId: friend.userId,
                    });
                    await loadContacts();
                  }}
                />
              ))}
            {requests.incoming.length > 0 && <h3>Lời mời đến</h3>}
            {requests.incoming.map((request) => (
              <div className="requestRow" key={request.requestId}>
                <span>{request.senderDisplayName}</span>
                <button
                  onClick={async () => {
                    await window.retroDesktop.respondFriendRequest({
                      requestId: request.requestId,
                      action: "accept",
                    });
                    await loadContacts();
                  }}
                >
                  ✓
                </button>
                <button
                  onClick={async () => {
                    await window.retroDesktop.respondFriendRequest({
                      requestId: request.requestId,
                      action: "reject",
                    });
                    await loadContacts();
                  }}
                >
                  ×
                </button>
              </div>
            ))}
            {requests.outgoing.length > 0 && <h3>Đang chờ</h3>}
            {requests.outgoing.map((request) => (
              <div className="requestRow" key={request.requestId}>
                <span>{request.recipientDisplayName}</span>
                <button
                  onClick={async () => {
                    await window.retroDesktop.respondFriendRequest({
                      requestId: request.requestId,
                      action: "cancel",
                    });
                    await loadContacts();
                  }}
                >
                  Hủy
                </button>
              </div>
            ))}
            {blocked.length > 0 && <h3>Đã chặn</h3>}
            {blocked.map((item) => (
              <div className="requestRow" key={item.userId}>
                <span>{item.displayName}</span>
                <button
                  onClick={async () => {
                    await window.retroDesktop.unblockContact({
                      userId: item.userId,
                    });
                    await loadContacts();
                  }}
                >
                  Bỏ chặn
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="sidebarFooter">
          <button
            onClick={() => {
              if (
                window.confirm(
                  "Xóa lịch sử cục bộ và hàng đợi chưa gửi của tài khoản này?",
                )
              )
                void window.retroDesktop.clearLocalData().then(() => {
                  setMessages([]);
                  setOutbox([]);
                });
            }}
          >
            Xóa cache
          </button>
          <button disabled={busy} onClick={() => void logout()}>
            Đăng xuất
          </button>
        </div>
      </aside>

      <section className="chatPanel">
        <header className="chatHeader">
          <div>
            <strong>{active?.title ?? "Chưa có cuộc trò chuyện"}</strong>
            <span>
              {typingUsers.size > 0
                ? "Đang nhập…"
                : pending.length > 0
                  ? `${pending.length} tin đang chờ gửi`
                  : "Đã đồng bộ"}
            </span>
          </div>
          <div className="headerActions">
            <button onClick={() => void attach()} disabled={!active}>
              📎 Tệp
            </button>
            <button
              onClick={() => void sendBuzz()}
              disabled={!active || Date.now() - lastBuzzAt < 10_000}
            >
              ⚡ Buzz
            </button>
          </div>
        </header>
        <div className="history" aria-live="polite">
          {!active && (
            <p className="emptyState">Chưa có cuộc trò chuyện nào.</p>
          )}
          {messages.map((message) => (
            <MessageView
              key={message.id}
              message={message}
              mine={message.senderId === session.user!.id}
            />
          ))}
          {pending.map((entry) => (
            <article
              className="message mine pending"
              key={entry.clientMessageId}
            >
              <p>{entry.content.split("\n")[0]}</p>
              <small>
                {entry.state === "failed-permanent"
                  ? "Không thể gửi"
                  : "Đang chờ gửi…"}
              </small>
            </article>
          ))}
        </div>
        {transfer && (
          <div className={`transfer ${transfer.state}`}>
            {transfer.direction === "upload" ? "Tải lên" : "Tải xuống"}:{" "}
            {transfer.fileName} — {transfer.state}
          </div>
        )}
        {error && (
          <p className="chatError" role="alert">
            {error}
          </p>
        )}
        <form className="composer" onSubmit={(event) => void send(event)}>
          <input
            aria-label="Tin nhắn"
            disabled={!active}
            maxLength={20_000}
            placeholder={active ? "Nhập tin nhắn…" : "Chọn một cuộc trò chuyện"}
            value={draft}
            onChange={(event) => changeDraft(event.target.value)}
          />
          <button className="sendButton" disabled={!active || !draft.trim()}>
            Gửi
          </button>
        </form>
        <Updater state={updater} />
      </section>
    </main>
  );
}

function ContactRow({
  friend,
  onBlock,
}: {
  friend: FriendDto;
  onBlock: () => Promise<void>;
}) {
  return (
    <div className="contactRow">
      <i className={friend.status === "online" ? "online" : ""} />
      <span>
        {friend.displayName}
        <small>@{friend.username}</small>
      </span>
      <button onClick={() => void onBlock()}>Chặn</button>
    </div>
  );
}

function MessageView({
  message,
  mine,
}: {
  message: MessageDto;
  mine: boolean;
}) {
  const attachment = attachmentPattern.exec(message.content);
  return (
    <article className={mine ? "message mine" : "message"}>
      {attachment ? (
        <button
          className="attachmentButton"
          onClick={() =>
            void window.retroDesktop.downloadAttachment({
              attachmentId: attachment[2]!,
              fileName: attachment[1]!,
            })
          }
        >
          📎 {attachment[1]}
        </button>
      ) : (
        <p>{message.content}</p>
      )}
      <small>#{message.sequence}</small>
    </article>
  );
}

function Updater({ state }: { state: DesktopUpdaterState }) {
  if (
    state.state === "disabled" ||
    state.state === "idle" ||
    state.state === "not-available"
  )
    return null;
  return (
    <div className="updater">
      <span>
        {state.state === "available"
          ? `Có bản ${state.version}`
          : state.state === "downloading"
            ? `Đang tải ${Math.round(state.percent ?? 0)}%`
            : state.state === "downloaded"
              ? "Bản cập nhật đã sẵn sàng"
              : (state.message ?? "Đang kiểm tra cập nhật…")}
      </span>
      {state.state === "available" && (
        <button onClick={() => void window.retroDesktop.downloadUpdate()}>
          Tải
        </button>
      )}
      {state.state === "downloaded" && (
        <button onClick={() => void window.retroDesktop.installUpdate()}>
          Cài và khởi động lại
        </button>
      )}
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
