import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import type { ConversationDto } from "@retro/contracts";
import type { RetroDesktopBridge } from "../shared/ipc-contracts.ts";
import { DesktopAuth } from "./components/DesktopAuth";
import { DesktopSidebar } from "./components/DesktopSidebar";
import { DesktopChatHeader } from "./components/DesktopChatHeader";
import { DesktopTranscript } from "./components/DesktopTranscript";
import { DesktopComposer } from "./components/DesktopComposer";
import { DesktopUpdater } from "./components/DesktopUpdater";
import { useDesktopSession } from "./hooks/useDesktopSession";
import { useDesktopContacts } from "./hooks/useDesktopContacts";
import { useDesktopConversations } from "./hooks/useDesktopConversations";
import "./style.css";

declare global {
  interface Window {
    retroDesktop: RetroDesktopBridge;
  }
}

export function DesktopApp() {
  const [section, setSection] = useState<"chats" | "contacts">("chats");

  const sessionState = useDesktopSession();
  const contactsState = useDesktopContacts(sessionState.setError);
  const conversationsState = useDesktopConversations(sessionState.setError);

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

  return (
    <main
      className={
        conversationsState.isBuzzing
          ? "messengerShell buzzing"
          : "messengerShell"
      }
    >
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
        onFriendUsernameChange={contactsState.setFriendUsername}
        onAddFriend={(event) => void contactsState.addFriend(event)}
        onBlockContact={contactsState.blockContact}
        onRespondFriendRequest={contactsState.respondFriendRequest}
        onUnblockContact={contactsState.unblockContact}
        onStatusChange={sessionState.updateStatus}
        onClearCache={() => {
          if (
            window.confirm(
              "Xóa lịch sử cục bộ và hàng đợi chưa gửi của tài khoản này?",
            )
          ) {
            void conversationsState.clearLocalData();
          }
        }}
        onLogout={async () => {
          await sessionState.logout();
          conversationsState.resetConversations();
          contactsState.resetContacts();
        }}
      />

      <section className="chatPanel">
        <DesktopChatHeader
          active={conversationsState.active}
          typingUsersCount={conversationsState.typingUsers.size}
          pendingCount={pending.length}
          lastBuzzAt={conversationsState.lastBuzzAt}
          onAttach={() => void conversationsState.attach()}
          onSendBuzz={() => void conversationsState.sendBuzz()}
        />

        <DesktopTranscript
          active={conversationsState.active}
          messages={conversationsState.messages}
          pending={pending}
          currentUserId={session.user.id}
          transfer={conversationsState.transfer}
          error={error}
          onDownloadAttachment={conversationsState.downloadAttachment}
        />

        <DesktopComposer
          disabled={!conversationsState.active}
          draft={conversationsState.draft}
          onDraftChange={conversationsState.changeDraft}
          onSubmit={(event) => void conversationsState.send(event)}
        />

        <DesktopUpdater state={updater} />
      </section>
    </main>
  );
}

const container = document.getElementById("root");
if (container) {
  createRoot(container).render(<DesktopApp />);
}
