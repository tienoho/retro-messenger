import { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import type { ConversationDto } from "@retro/contracts";
import type { RetroDesktopBridge } from "../shared/ipc-contracts.ts";
import { DesktopAuth } from "./components/DesktopAuth";
import { DesktopSidebar } from "./components/DesktopSidebar";
import { DesktopChatHeader } from "./components/DesktopChatHeader";
import { DesktopChatTabs } from "./components/DesktopChatTabs";
import { DesktopTranscript } from "./components/DesktopTranscript";
import { DesktopComposer } from "./components/DesktopComposer";
import { DesktopUpdater } from "./components/DesktopUpdater";
import { DesktopCallOverlay } from "./components/DesktopCallOverlay";
import { DesktopWindowTitleBar } from "./components/DesktopWindowTitleBar";
import { DesktopWindowMenuBar } from "./components/DesktopWindowMenuBar";
import { DesktopCustomStatusDialog } from "./components/DesktopCustomStatusDialog";
import { DesktopAboutDialog } from "./components/DesktopAboutDialog";
import { DesktopSkinPicker } from "./components/DesktopSkinPicker";
import { DesktopCaroGameDialog } from "./components/DesktopCaroGameDialog";
import {
  YAHOO_SKINS,
  YAHOO_IMVIRONMENTS,
  type YahooSkinDefinition,
  type ImvironmentDefinition,
} from "@retro/design-tokens";
import { useDesktopSession } from "./hooks/useDesktopSession";
import { useDesktopContacts } from "./hooks/useDesktopContacts";
import { useDesktopConversations } from "./hooks/useDesktopConversations";
import { useDesktopCall } from "./features/calls";
import { useDesktopAudio } from "./audio/useDesktopAudio";
import "./style.css";

declare global {
  interface Window {
    retroDesktop: RetroDesktopBridge;
  }
}

export function DesktopApp() {
  const [section, setSection] = useState<"chats" | "contacts">("chats");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showAbout, setShowAbout] = useState(false);
  const [showCustomStatus, setShowCustomStatus] = useState(false);
  const [showSkinPicker, setShowSkinPicker] = useState(false);
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
  const [currentImvironment, setCurrentImvironment] =
    useState<ImvironmentDefinition>(
      YAHOO_IMVIRONMENTS[0] ?? {
        id: "classic",
        name: "Yahoo! Tím Classic",
        icon: "classic",
        background: "#ffffff",
        textColor: "#202020",
      },
    );

  const desktopAudio = useDesktopAudio();

  const audioHandlers = useMemo(() => {
    if (!soundEnabled) return undefined;
    return {
      playMessageSound: desktopAudio.playMessageSound,
      playSentSound: desktopAudio.playSentSound,
      playBuzzSound: desktopAudio.playBuzzSound,
    };
  }, [soundEnabled, desktopAudio]);

  const contactAudioHandlers = useMemo(() => {
    if (!soundEnabled) return undefined;
    return {
      playDoorOpen: desktopAudio.playDoorOpen,
      playDoorSlam: desktopAudio.playDoorSlam,
    };
  }, [soundEnabled, desktopAudio]);

  const sessionState = useDesktopSession();
  const contactsState = useDesktopContacts(
    sessionState.setError,
    contactAudioHandlers,
  );
  const conversationsState = useDesktopConversations(
    sessionState.setError,
    audioHandlers,
  );
  const call = useDesktopCall(
    typeof window !== "undefined" ? window.retroDesktop : undefined,
    sessionState.session?.user?.id,
  );

  const { session, updater, busy, error, username, password } = sessionState;

  // On session authentication change, load conversations and contacts
  useEffect(() => {
    if (session?.authenticated) {
      void Promise.allSettled([
        conversationsState.loadConversations(),
        contactsState.loadContacts(),
      ]);
    }
  }, [session?.authenticated]);

  if (session === null) {
    return <main className="loadingScreen">Đang khôi phục phiên an toàn…</main>;
  }

  if (!session.authenticated || !session.user) {
    return (
      <DesktopAuth
        username={username}
        password={password}
        busy={busy}
        error={error}
        updater={updater}
        onUsernameChange={sessionState.setUsername}
        onPasswordChange={sessionState.setPassword}
        onSubmit={async (event) => {
          const ok = await sessionState.login(event);
          if (ok) {
            await Promise.allSettled([
              conversationsState.loadConversations(),
              contactsState.loadContacts(),
            ]);
          }
        }}
        onSelectDemo={sessionState.selectDemo}
      />
    );
  }

  const pending = conversationsState.outbox.filter(
    (entry) => entry.conversationId === conversationsState.active?.id,
  );

  // Sync open tabs with active conversation
  useEffect(() => {
    if (conversationsState.active) {
      const activeConv = conversationsState.active;
      setOpenTabs((prev) => {
        if (prev.some((t) => t.id === activeConv.id)) return prev;
        return [...prev, activeConv];
      });
    }
  }, [conversationsState.active]);

  const handleCloseTab = (tabId: string) => {
    setOpenTabs((prev) => {
      const nextTabs = prev.filter((t) => t.id !== tabId);
      if (conversationsState.active?.id === tabId) {
        const nextActive = nextTabs[nextTabs.length - 1];
        if (nextActive) {
          void conversationsState.openConversation(nextActive);
        }
      }
      return nextTabs;
    });
  };

  const handleLogout = async () => {
    await sessionState.logout();
    conversationsState.resetConversations();
    contactsState.resetContacts();
    setOpenTabs([]);
  };

  return (
    <div
      className="desktopAppContainer"
      style={
        {
          "--yahoo-purple-gradient": currentSkin.primaryGradient,
          "--window-bg": currentSkin.windowBg,
          "--window-border": currentSkin.border,
        } as React.CSSProperties
      }
    >
      {/* 1. Yahoo Window Title Bar */}
      <DesktopWindowTitleBar
        title="Yahoo! Messenger"
        displayName={session.user.displayName}
        status={session.user.status}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((prev) => !prev)}
        onClose={() => void handleLogout()}
      />

      {/* 2. Yahoo Window Menu Bar */}
      <DesktopWindowMenuBar
        onLogout={() => void handleLogout()}
        onOpenAddFriend={() => setSection("contacts")}
        onOpenAbout={() => setShowAbout(true)}
        onOpenCustomStatus={() => setShowCustomStatus(true)}
        onOpenSkinPicker={() => setShowSkinPicker(true)}
        onOpenGame={() => setShowGameDialog(true)}
        onSendBuzz={() => void conversationsState.sendBuzz()}
        onStartVoiceCall={() => {
          if (conversationsState.active) {
            void call.startCall(
              conversationsState.active.id,
              "audio",
              conversationsState.active.title,
            );
          }
        }}
        onStartVideoCall={() => {
          if (conversationsState.active) {
            void call.startCall(
              conversationsState.active.id,
              "video",
              conversationsState.active.title,
            );
          }
        }}
        onChangeStatus={sessionState.updateStatus}
        onClearCache={() => {
          if (
            window.confirm(
              "Xóa lịch sử cục bộ và hàng đợi chưa gửi của tài khoản này?",
            )
          ) {
            void conversationsState.clearLocalData();
          }
        }}
      />

      {/* 3. Main Messenger Shell (Sidebar + Chat Panel) */}
      <main
        className={
          conversationsState.isBuzzing
            ? "messengerShell buzzing"
            : "messengerShell"
        }
      >
        <DesktopCallOverlay
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

        <DesktopSidebar
          session={session}
          section={section}
          conversations={conversationsState.conversations}
          activeConversationId={conversationsState.active?.id}
          friends={contactsState.friends}
          requests={contactsState.requests}
          blocked={contactsState.blocked}
          friendUsername={contactsState.friendUsername}
          busy={busy}
          onSectionChange={setSection}
          onOpenConversation={(conv: ConversationDto) => {
            void conversationsState.openConversation(conv);
          }}
          onStartChat={(friend) => {
            const match = conversationsState.conversations.find(
              (c) =>
                c.memberIds?.includes(friend.userId) ||
                c.title.toLowerCase().includes(friend.displayName.toLowerCase()) ||
                c.title.toLowerCase().includes(friend.username.toLowerCase()),
            );
            if (match) {
              void conversationsState.openConversation(match);
              setSection("chats");
            } else {
              void window.retroDesktop?.notify({
                title: "Retro Messenger",
                body: `Đang kết nối hội thoại với ${friend.displayName}…`,
              });
            }
          }}
          onEditCustomStatus={() => setShowCustomStatus(true)}
          onFriendUsernameChange={contactsState.setFriendUsername}
          onAddFriend={(event) => void contactsState.addFriend(event)}
          onBlockContact={contactsState.blockContact}
          onRespondFriendRequest={contactsState.respondFriendRequest}
          onUnblockContact={contactsState.unblockContact}
          onStatusChange={sessionState.updateStatus}
          onSendBuzz={() => void conversationsState.sendBuzz()}
          onStartCall={(_userId, displayName) => {
            if (conversationsState.active) {
              void call.startCall(
                conversationsState.active.id,
                "audio",
                displayName,
              );
            }
          }}
          onClearCache={() => {
            if (
              window.confirm(
                "Xóa lịch sử cục bộ và hàng đợi chưa gửi của tài khoản này?",
              )
            ) {
              void conversationsState.clearLocalData();
            }
          }}
          onLogout={() => void handleLogout()}
        />

        <section className="chatPanel">
          <DesktopChatTabs
            tabs={openTabs}
            activeId={conversationsState.active?.id}
            onSelectTab={(conv) => {
              void conversationsState.openConversation(conv);
            }}
            onCloseTab={handleCloseTab}
          />

          <DesktopChatHeader
            active={conversationsState.active}
            typingUsersCount={conversationsState.typingUsers.size}
            pendingCount={pending.length}
            lastBuzzAt={conversationsState.lastBuzzAt}
            onAttach={() => void conversationsState.attach()}
            onSendBuzz={() => void conversationsState.sendBuzz()}
            onStartVoiceCall={() => {
              if (conversationsState.active) {
                void call.startCall(
                  conversationsState.active.id,
                  "audio",
                  conversationsState.active.title,
                );
              }
            }}
            onStartVideoCall={() => {
              if (conversationsState.active) {
                void call.startCall(
                  conversationsState.active.id,
                  "video",
                  conversationsState.active.title,
                );
              }
            }}
          />

          <DesktopTranscript
            active={conversationsState.active}
            messages={conversationsState.messages}
            pending={pending}
            currentUserId={session.user.id}
            transfer={conversationsState.transfer}
            error={error}
            imvironment={currentImvironment}
            onDownloadAttachment={conversationsState.downloadAttachment}
          />

          <DesktopComposer
            disabled={!conversationsState.active}
            draft={conversationsState.draft}
            onDraftChange={conversationsState.changeDraft}
            onSubmit={(event) => void conversationsState.send(event)}
            onSendBuzz={() => void conversationsState.sendBuzz()}
            onAttach={() => void conversationsState.attach()}
            onSendCustomMessage={(content) => void conversationsState.sendCustomMessage(content)}
            currentImvironmentId={currentImvironment.id}
            onSelectImvironment={setCurrentImvironment}
            onOpenGame={() => setShowGameDialog(true)}
          />

          <DesktopUpdater state={updater} />
        </section>
      </main>

      {/* 4. Modals */}
      {showCustomStatus && (
        <DesktopCustomStatusDialog
          currentCustomStatus={session.user.customStatus}
          onSave={async (custom) => {
            await sessionState.updateCustomStatus(custom);
          }}
          onClose={() => setShowCustomStatus(false)}
        />
      )}

      {showSkinPicker && (
        <DesktopSkinPicker
          currentSkinId={currentSkin.id}
          onSelectSkin={setCurrentSkin}
          onClose={() => setShowSkinPicker(false)}
        />
      )}

      {showGameDialog && (
        <DesktopCaroGameDialog
          partnerName={conversationsState.active?.title ?? "Bạn bè"}
          onClose={() => setShowGameDialog(false)}
          onSendGameMessage={(text) => {
            void conversationsState.sendCustomMessage(text);
          }}
        />
      )}

      {showAbout && (
        <DesktopAboutDialog onClose={() => setShowAbout(false)} />
      )}
    </div>
  );
}

const container = document.getElementById("root");
if (container) {
  createRoot(container).render(<DesktopApp />);
}
