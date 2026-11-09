import { useState } from "react";
import type {
  BlockedContactDto,
  ContactRequestStateDto,
  ConversationDto,
  FriendDto,
  RoomDto,
  UserDto,
} from "@retro/contracts";
import { UserProfileStrip } from "../profile/UserProfileStrip";
import { SidebarTabs, type SidebarTab } from "./SidebarTabs";
import { ConversationList } from "./ConversationList";
import { BuddyList } from "./BuddyList";
import { RoomList } from "./RoomList";

export interface SidebarProps {
  user: UserDto;
  userStatus: string;
  customStatus: string;
  onStatusChange: (status: string) => Promise<void>;
  onCustomStatusChange: (status: string) => Promise<void>;
  onSendBuzz?: (() => void) | undefined;
  onStartCall?: ((userId: string, displayName: string) => void) | undefined;
  hasActiveConversation: boolean;
  conversations: ConversationDto[];
  activeId: string | null;
  onSelectConversation: (conv: ConversationDto) => void;
  friends: FriendDto[];
  requests: ContactRequestStateDto;
  blocked: BlockedContactDto[];
  onAddFriend: (username: string) => Promise<boolean>;
  onRespondRequest: (
    requestId: string,
    action: "accept" | "reject" | "cancel",
  ) => Promise<boolean>;
  onUnblock: (userId: string) => Promise<boolean>;
  onStartChat: (userId: string, displayName: string) => Promise<void>;
  rooms: RoomDto[];
  onCreateRoom: (title: string, description?: string) => Promise<unknown>;
  onJoinRoom: (roomId: string, roomName: string) => Promise<unknown>;
  className?: string | undefined;
}

export function Sidebar({
  user,
  userStatus,
  customStatus,
  onStatusChange,
  onCustomStatusChange,
  onSendBuzz,
  onStartCall,
  hasActiveConversation,
  conversations,
  activeId,
  onSelectConversation,
  friends,
  requests,
  blocked,
  onAddFriend,
  onRespondRequest,
  onUnblock,
  onStartChat,
  rooms,
  onCreateRoom,
  onJoinRoom,
  className,
}: SidebarProps) {
  const [activeTab, setActiveTab] = useState<SidebarTab>("chats");

  return (
    <aside className={`sidebar ${className ?? ""}`.trim()}>
      <UserProfileStrip
        user={user}
        userStatus={userStatus}
        customStatus={customStatus}
        onStatusChange={onStatusChange}
        onCustomStatusChange={onCustomStatusChange}
        onOpenAddFriend={() => setActiveTab("contacts")}
        onOpenRooms={() => setActiveTab("rooms")}
        onSendBuzz={onSendBuzz}
        hasActiveConversation={hasActiveConversation}
      />

      <SidebarTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        pendingRequestsCount={requests.incoming.length}
      />

      {activeTab === "chats" && (
        <ConversationList
          conversations={conversations}
          activeId={activeId}
          onSelect={onSelectConversation}
          onOpenContactsTab={() => setActiveTab("contacts")}
        />
      )}

      {activeTab === "contacts" && (
        <BuddyList
          friends={friends}
          requests={requests}
          blocked={blocked}
          onAddFriend={onAddFriend}
          onRespondRequest={onRespondRequest}
          onUnblock={onUnblock}
          onStartChat={onStartChat}
          onSendBuzz={() => onSendBuzz?.()}
          onStartCall={onStartCall}
        />
      )}

      {activeTab === "rooms" && (
        <RoomList
          rooms={rooms}
          onCreateRoom={onCreateRoom}
          onJoinRoom={onJoinRoom}
        />
      )}
    </aside>
  );
}
