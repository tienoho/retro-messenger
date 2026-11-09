import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RetroApiClient } from "@retro/api-client";
import { RetroRealtimeClient } from "@retro/realtime-client";
import type { ConversationDto, SessionDto } from "@retro/contracts";
import {
  YAHOO_IMVIRONMENTS,
  YAHOO_SKINS,
  type ImvironmentDefinition,
  type YahooSkinDefinition,
  type YahooAudibleDefinition,
} from "@retro/design-tokens";

import { useRetroAudio } from "./audio/useRetroAudio";
import { useContacts } from "./hooks/useContacts";
import { useRooms } from "./hooks/useRooms";
import { useConversations } from "./hooks/useConversations";
import { useAttachmentUpload } from "./features/attachments";
import { useLiveKitCall } from "./features/calls";

import { AuthDialog } from "./components/auth/AuthDialog";
import { WindowTitleBar } from "./components/chrome/WindowTitleBar";
import { WindowMenuBar } from "./components/chrome/WindowMenuBar";
import { AboutDialog } from "./components/chrome/AboutDialog";
import { CustomStatusDialog } from "./components/chrome/CustomStatusDialog";
import { SkinPickerDialog } from "./components/chrome/SkinPickerDialog";
import { CaroGameDialog } from "./components/chat/CaroGameDialog";
import { ChatTabs } from "./components/chat/ChatTabs";
import { Sidebar } from "./components/sidebar/Sidebar";
import { ChatTranscript } from "./components/chat/ChatTranscript";
import { MessageComposer } from "./components/chat/MessageComposer";
import type { ChatFontStyle } from "./components/chat/FormatToolbar";
import { CallOverlay } from "./widgets/call-overlay";
import { IconPhone, IconVideo, IconBuzz, IconPencil } from "./icons/UiIcons";
import "./styles.css";

const apiBase = import.meta.env.VITE_API_URL ?? "";
const realtimeUrl =
  import.meta.env.VITE_REALTIME_URL ??
  `${window.location.protocol}//${window.location.host}/realtime`;

function formatAuthError(caught: unknown): string {
  if (caught instanceof Error) {
    const msg = caught.message;
    if (
      msg.includes("401") ||
      msg.includes("AUTHENTICATION_FAILED") ||
      msg.includes("Authentication failed")
    ) {
      return "Tên đăng nhập hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại!";
    }
    if (
      msg.includes("Username is already taken") ||
      msg.includes("already taken")
    ) {
      return "Tên đăng nhập này đã có người sử dụng. Vui lòng chọn tên khác!";
    }
    try {
      const jsonStart = msg.indexOf("{");
      if (jsonStart !== -1) {
        const parsed = JSON.parse(msg.slice(jsonStart));
        if (parsed.detail) return parsed.detail;
        if (parsed.title && parsed.title !== "Authentication failed.")
          return parsed.title;
      }
    } catch {
      // ignore
    }
    return msg;
  }
  return "Không thể hoàn tất xác thực. Vui lòng thử lại.";
}

export function App() {
  const api = useMemo(() => new RetroApiClient(apiBase), []);
  const realtime = useMemo(
    () =>
      new RetroRealtimeClient(realtimeUrl, async () => api.getAccessToken()),
    [api],
  );

  const {
    playYahooChime,
    playBuzzSound,
    playMessageSound,
    playSentSound,
    playDoorOpen,
    playDoorSlam,
    playAudibleSound,
  } = useRetroAudio();

  // Authentication State
  const [authenticated, setAuthenticated] = useState(false);
  const [session, setSession] = useState<SessionDto | null>(null);
  const [authenticating, setAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Sound & Modals
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showAboutDialog, setShowAboutDialog] = useState(false);
  const [showCustomStatusDialog, setShowCustomStatusDialog] = useState(false);
  const [showSkinDialog, setShowSkinDialog] = useState(false);
  const [showGameDialog, setShowGameDialog] = useState(false);
  const [openTabs, setOpenTabs] = useState<ConversationDto[]>([]);
  const [currentSkin, setCurrentSkin] = useState<YahooSkinDefinition>(
    YAHOO_SKINS[0] ?? {
      id: "purple",
      name: "Tím Yahoo! Classic",
      primaryGradient:
        "linear-gradient(180deg, #6c238f 0%, #541973 45%, #42125d 50%, #5d1f7e 100%)",
      windowBg: "#ede7f6",
      border: "#5b1e84",
      accent: "#fed633",
    },
  );

  // Network & Status
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [realtimeStatus, setRealtimeStatus] = useState<
    "Trực tuyến" | "Ngoại tuyến"
  >("Ngoại tuyến");
  const [userStatus, setUserStatus] = useState<string>("online");
  const [customStatus, setCustomStatus] = useState<string>("");
  const [draft, setDraft] = useState("");
  const [actionAlert, setActionAlert] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Retro Yahoo Chat Customizations
  const [fontStyle, setFontStyle] = useState<ChatFontStyle>({
    fontFamily: "Tahoma",
    fontSize: "13px",
    color: "#0000cc",
    bold: false,
    italic: false,
    underline: false,
  });
  const [currentImvironment, setCurrentImvironment] =
    useState<ImvironmentDefinition>(YAHOO_IMVIRONMENTS[0]!);
  const [buzzCooldown, setBuzzCooldown] = useState(0);
  const buzzCooldownTimer = useRef<number | null>(null);

  // Features
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

  const handleIncomingMessageSound = useCallback(() => {
    if (soundEnabled) playMessageSound();
  }, [playMessageSound, soundEnabled]);

  const handleBuzzSound = useCallback(() => {
    if (soundEnabled) playBuzzSound();
  }, [playBuzzSound, soundEnabled]);

  // Conversations & Messages Hook
  const {
    conversations,
    setConversations,
    active,
    setActive,
    messages,
    loadConversations,
    flushOutbox,
    sendMessage,
    triggerBuzz,
    notifyTyping,
    isBuzzing,
    isTyping,
  } = useConversations(
    api,
    realtime,
    session?.user.id,
    isOnline,
    handleIncomingMessageSound,
    handleBuzzSound,
  );

  // Contacts Hook
  const {
    friends,
    setFriends,
    requests,
    blocked,
    loadContacts,
    addFriend,
    respondRequest,
    unblockContact,
    startChatWithFriend,
  } = useContacts(api, (conv) => {
    setActive(conv);
    void loadConversations();
  });

  // Rooms Hook
  const { rooms, loadRooms, createRoom, joinRoom } = useRooms(api, (conv) => {
    setActive(conv);
    void loadConversations();
  });

  // Online / Offline window events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      void flushOutbox();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [flushOutbox]);

  // Realtime connection lifecycle & Presence listener
  useEffect(() => {
    if (!authenticated || !session) return;

    const unsubPresence = realtime.onPresence((event) => {
      setFriends((current) =>
        current.map((friend) => {
          if (friend.userId === event.userId) {
            if (soundEnabled) {
              if (event.status === "online" && friend.status !== "online") {
                playDoorOpen();
              } else if (
                event.status !== "online" &&
                friend.status === "online"
              ) {
                playDoorSlam();
              }
            }
            return { ...friend, status: event.status };
          }
          return friend;
        }),
      );
    });

    const unsubReconnected = realtime.onReconnected(() => {
      setRealtimeStatus("Trực tuyến");
      void loadConversations();
      void flushOutbox();
    });

    void realtime
      .start()
      .then(() => {
        setRealtimeStatus("Trực tuyến");
      })
      .catch(() => {
        setRealtimeStatus("Ngoại tuyến");
      });

    return () => {
      unsubPresence();
      unsubReconnected();
      void realtime.stop();
    };
  }, [
    authenticated,
    flushOutbox,
    loadConversations,
    playDoorOpen,
    playDoorSlam,
    realtime,
    session,
    setFriends,
    soundEnabled,
  ]);

  // Load initial workspace data when authenticated
  useEffect(() => {
    if (!authenticated) return;
    void (async () => {
      const convs = await loadConversations();
      await loadContacts();
      await loadRooms();
      if (convs.length > 0 && !active) {
        setActive(convs[0]!);
      }
    })();
  }, [authenticated, loadContacts, loadConversations, loadRooms]);

  // Auth actions
  const handleLogin = async (u: string, p: string) => {
    setAuthenticating(true);
    setAuthError(null);
    try {
      const response = await api.login(u, p);
      setSession({ user: response.user });
      setUserStatus(response.user.status);
      setCustomStatus(response.user.customStatus ?? "");
      setAuthenticated(true);
      if (soundEnabled) playYahooChime();
    } catch (caught) {
      setAuthError(formatAuthError(caught));
    } finally {
      setAuthenticating(false);
    }
  };

  const handleRegister = async (u: string, dn: string, p: string) => {
    setAuthenticating(true);
    setAuthError(null);
    try {
      const response = await api.register(u, dn, p);
      setSession({ user: response.user });
      setUserStatus(response.user.status);
      setCustomStatus(response.user.customStatus ?? "");
      setAuthenticated(true);
      if (soundEnabled) playYahooChime();
    } catch (caught) {
      setAuthError(formatAuthError(caught));
    } finally {
      setAuthenticating(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {
      // Ignored
    } finally {
      setAuthenticated(false);
      setSession(null);
      setActive(null);
      setOpenTabs([]);
    }
  };

  // Sync open tabs with active conversation
  useEffect(() => {
    if (active) {
      setOpenTabs((prev) => {
        if (prev.some((t) => t.id === active.id)) return prev;
        return [...prev, active];
      });
    }
  }, [active]);

  const handleCloseTab = (tabId: string) => {
    setOpenTabs((prev) => {
      const nextTabs = prev.filter((t) => t.id !== tabId);
      if (active?.id === tabId) {
        const nextActive = nextTabs[nextTabs.length - 1];
        setActive(nextActive ?? null);
      }
      return nextTabs;
    });
  };

  const handleStatusChange = async (nextStatus: string) => {
    setUserStatus(nextStatus);
    try {
      await api.updateStatus(nextStatus);
    } catch {
      // Ignored
    }
  };

  const handleCustomStatusChange = async (nextCustomStatus: string) => {
    setCustomStatus(nextCustomStatus);
    try {
      await api.updateProfile(
        session?.user.displayName ?? "",
        nextCustomStatus,
      );
    } catch {
      // Ignored
    }
  };

  const handleSendBuzz = () => {
    if (buzzCooldown > 0) return;
    setBuzzCooldown(10);
    if (buzzCooldownTimer.current) {
      window.clearInterval(buzzCooldownTimer.current);
    }
    buzzCooldownTimer.current = window.setInterval(() => {
      setBuzzCooldown((prev) => {
        if (prev <= 1) {
          if (buzzCooldownTimer.current) {
            window.clearInterval(buzzCooldownTimer.current);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    void triggerBuzz();
  };

  const handleSendAudible = (audible: YahooAudibleDefinition) => {
    if (soundEnabled) {
      playAudibleSound(audible.soundType);
    }
    void sendMessage(audible.text);
  };

  const handleReplayAudible = (text: string) => {
    if (!soundEnabled) return;
    if (text.includes("Hey")) playAudibleSound("hey");
    else if (text.includes("Miss")) playAudibleSound("missyou");
    else if (text.includes("WooHoo") || text.includes("Party"))
      playAudibleSound("woohoo");
    else if (text.includes("Haha") || text.includes("ROFL"))
      playAudibleSound("laugh");
    else if (text.includes("Bye")) playAudibleSound("byebye");
    else playAudibleSound("buzz");
  };

  const handleSend = async () => {
    if (!draft.trim() && attachments.length === 0) return;
    let fullContent = draft.trim();
    if (attachments.length > 0) {
      const attLines = attachments
        .map((a) => `[attachment:${a.id}] ${a.fileName}`)
        .join("\n");
      fullContent = fullContent ? `${fullContent}\n${attLines}` : attLines;
    }
    setDraft("");
    clearAttachments();
    if (soundEnabled) playSentSound();
    await sendMessage(fullContent);
  };

  const handleDownloadAttachment = async (attachmentId: string) => {
    try {
      setDownloadError(null);
      const res = await api.getAttachmentDownloadUrl(attachmentId);
      window.open(res.downloadUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      setDownloadError(
        err instanceof Error ? err.message : "Không thể tải tập tin.",
      );
    }
  };

  const handleStartChatWithFriend = async (
    friendUserId: string,
    friendDisplayName: string,
  ) => {
    const target = await startChatWithFriend(friendUserId, friendDisplayName);
    if (target) {
      setActive(target);
      await loadConversations();
    }
  };

  // If unauthenticated, show Retro Yahoo! Sign In Box
  if (!authenticated || !session) {
    return (
      <AuthDialog
        onLogin={handleLogin}
        onRegister={handleRegister}
        authenticating={authenticating}
        authError={authError}
        onClearError={() => setAuthError(null)}
      />
    );
  }

  return (
    <main
      className={`shell ${isBuzzing ? "bzzing" : ""}`}
      style={
        {
          "--yahoo-purple-gradient": currentSkin.primaryGradient,
          "--window-bg": currentSkin.windowBg,
          "--window-border": currentSkin.border,
        } as React.CSSProperties
      }
    >
      <WindowTitleBar
        title={`Retro! Messenger — ${session.user.displayName}`}
        isOnline={isOnline}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((prev) => !prev)}
        onLogout={() => void handleLogout()}
      />

      <WindowMenuBar
        onLogout={() => void handleLogout()}
        onOpenAddFriend={() => void loadContacts()}
        onOpenRooms={() => void loadRooms()}
        onOpenAbout={() => setShowAboutDialog(true)}
        onOpenCustomStatus={() => setShowCustomStatusDialog(true)}
        onOpenSkinPicker={() => setShowSkinDialog(true)}
        onOpenGame={() => setShowGameDialog(true)}
        onSendBuzz={active ? handleSendBuzz : undefined}
        onStartCall={
          active
            ? () => {
                void call.startCall(active.id, "video");
              }
            : undefined
        }
        onChangeStatus={(st) => void handleStatusChange(st)}
      />

      {!isOnline && (
        <div className="offlineBanner">
          <IconBuzz size={13} style={{ marginRight: 6, verticalAlign: "middle" }} />
          Bạn đang ngoại tuyến. Tin nhắn sẽ lưu vào Outbox và tự động gửi khi kết nối lại.
        </div>
      )}

      {actionAlert && (
        <div className={`actionAlert ${actionAlert.type}`}>
          {actionAlert.text}
        </div>
      )}

      <div className="retroAppBody">
        <Sidebar
          user={session.user}
          userStatus={userStatus}
          customStatus={customStatus}
          onStatusChange={handleStatusChange}
          onCustomStatusChange={handleCustomStatusChange}
          onSendBuzz={active ? handleSendBuzz : undefined}
          hasActiveConversation={Boolean(active)}
          conversations={conversations}
          activeId={active?.id ?? null}
          onSelectConversation={setActive}
          friends={friends}
          requests={requests}
          blocked={blocked}
          onAddFriend={async (u) => {
            const ok = await addFriend(u);
            if (ok) {
              setActionAlert({
                type: "success",
                text: "Đã gửi lời mời kết bạn!",
              });
              setTimeout(() => setActionAlert(null), 3000);
            }
            return ok;
          }}
          onRespondRequest={respondRequest}
          onUnblock={unblockContact}
          onStartChat={handleStartChatWithFriend}
          onStartCall={(friendUserId, friendDisplayName) => {
            void handleStartChatWithFriend(friendUserId, friendDisplayName).then(() => {
              // Wait for active conversation state then start call
              setTimeout(() => {
                const target = conversations.find((c) =>
                  c.title.includes(friendDisplayName),
                );
                if (target) void call.startCall(target.id, "audio");
              }, 150);
            });
          }}
          rooms={rooms}
          onCreateRoom={createRoom}
          onJoinRoom={joinRoom}
        />

        <section className="chat">
          <ChatTabs
            tabs={openTabs}
            activeId={active?.id}
            onSelectTab={setActive}
            onCloseTab={handleCloseTab}
          />
          <div className="imHeader">
            <div className="imRecipient">
              <div className="imRecipientAvatar">
                {active?.title?.slice(0, 1) ?? "R"}
              </div>
              <div>
                <div className="imRecipientTitle">
                  {active?.title ?? "Chưa chọn cuộc trò chuyện"}
                </div>
                <div className="imRecipientStatus">
                  {isTyping ? (
                    <span>
                      <IconPencil size={11} style={{ marginRight: 3, verticalAlign: "middle" }} />
                      Đối phương đang gõ phím...
                    </span>
                  ) : (
                    realtimeStatus
                  )}
                </div>
              </div>
            </div>

            <div className="imHeaderActions">
              <button
                type="button"
                className="imActionBtn"
                title="Gọi thoại Audio"
                disabled={!active}
                onClick={() =>
                  active && void call.startCall(active.id, "audio")
                }
              >
                <IconPhone size={12} style={{ marginRight: 4, verticalAlign: "middle" }} />
                Thoại
              </button>
              <button
                type="button"
                className="imActionBtn"
                title="Gọi video Webcam"
                disabled={!active}
                onClick={() =>
                  active && void call.startCall(active.id, "video")
                }
              >
                <IconVideo size={12} style={{ marginRight: 4, verticalAlign: "middle" }} />
                Video
              </button>
              <button
                type="button"
                className="imActionBtn imBuzzBtn"
                title={
                  buzzCooldown > 0
                    ? `Chờ ${buzzCooldown}s`
                    : "Gửi BUZZ! rung lắc màn hình"
                }
                disabled={!active || buzzCooldown > 0}
                onClick={handleSendBuzz}
              >
                <IconBuzz size={12} style={{ marginRight: 4, verticalAlign: "middle" }} />
                {buzzCooldown > 0 ? `BUZZ (${buzzCooldown}s)` : "BUZZ!"}
              </button>
            </div>
          </div>

          <ChatTranscript
            messages={messages}
            currentUserId={session.user.id}
            activeConversationTitle={active?.title}
            imvironment={currentImvironment}
            onDownloadAttachment={(attId) =>
              void handleDownloadAttachment(attId)
            }
            onReplayAudible={handleReplayAudible}
            isTyping={isTyping}
          />

          <MessageComposer
            draft={draft}
            fontStyle={fontStyle}
            onFontStyleChange={setFontStyle}
            onDraftChange={(val) => {
              setDraft(val);
              notifyTyping();
            }}
            onSend={handleSend}
            onSendBuzz={handleSendBuzz}
            buzzCooldownSeconds={buzzCooldown}
            onInsertEmoticon={(code) =>
              setDraft((prev) => (prev ? `${prev} ${code} ` : `${code} `))
            }
            onSendAudible={handleSendAudible}
            currentImvironmentId={currentImvironment.id}
            onSelectImvironment={setCurrentImvironment}
            onOpenGame={() => setShowGameDialog(true)}
            onFileSelect={(file) => active && void uploadFile(active.id, file)}
            disabled={!active}
            isUploading={isUploading}
            attachments={attachments}
            onRemoveAttachment={removeAttachment}
            mediaError={uploadError ?? downloadError}
          />
        </section>
      </div>

      {showCustomStatusDialog && (
        <CustomStatusDialog
          currentCustomStatus={customStatus}
          onSave={async (newStatus) => {
            await handleCustomStatusChange(newStatus ?? "");
          }}
          onClose={() => setShowCustomStatusDialog(false)}
        />
      )}

      {showSkinDialog && (
        <SkinPickerDialog
          currentSkinId={currentSkin.id}
          onSelectSkin={setCurrentSkin}
          onClose={() => setShowSkinDialog(false)}
        />
      )}

      {showGameDialog && (
        <CaroGameDialog
          partnerName={active?.title ?? "Bạn bè"}
          onClose={() => setShowGameDialog(false)}
          onSendGameMessage={(text) => {
            void sendMessage(text);
          }}
        />
      )}

      {showAboutDialog && (
        <AboutDialog onClose={() => setShowAboutDialog(false)} />
      )}

      <CallOverlay
        callState={call.callState}
        callType={call.callType}
        callerName={call.callerName}
        isMuted={call.isMuted}
        isVideoOff={call.isVideoOff}
        localStream={call.localStream}
        remoteStream={call.remoteStream}
        durationFormatted={call.durationFormatted}
        localAudioLevel={call.localAudioLevel}
        remoteAudioLevel={call.remoteAudioLevel}
        onAccept={() => void call.acceptCall()}
        onDecline={() => void call.declineCall()}
        onLeave={() => void call.leaveCall()}
        onToggleMute={call.toggleMute}
        onToggleVideo={call.toggleVideo}
      />
    </main>
  );
}
