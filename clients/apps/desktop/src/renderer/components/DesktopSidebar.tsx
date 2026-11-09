import type { FormEvent } from "react";
import type {
  BlockedContactDto,
  ContactRequestStateDto,
  ConversationDto,
  FriendDto,
} from "@retro/contracts";
import type { DesktopSessionState } from "../../shared/ipc-contracts.ts";
import { DesktopContactRow } from "./DesktopContactRow";

export interface DesktopSidebarProps {
  session: DesktopSessionState;
  section: "chats" | "contacts";
  conversations: ConversationDto[];
  activeConversationId?: string | undefined;
  friends: FriendDto[];
  requests: ContactRequestStateDto;
  blocked: BlockedContactDto[];
  friendUsername: string;
  busy: boolean;
  onSectionChange: (section: "chats" | "contacts") => void;
  onOpenConversation: (conversation: ConversationDto) => void;
  onFriendUsernameChange: (username: string) => void;
  onAddFriend: (event: FormEvent<HTMLFormElement>) => void;
  onBlockContact: (friend: FriendDto) => Promise<void>;
  onRespondFriendRequest: (
    requestId: string,
    action: "accept" | "reject" | "cancel",
  ) => Promise<void>;
  onUnblockContact: (userId: string) => Promise<void>;
  onStatusChange: (
    status: "online" | "away" | "busy" | "invisible",
  ) => Promise<void>;
  onClearCache: () => void;
  onLogout: () => void;
}

export function DesktopSidebar({
  session,
  section,
  conversations,
  activeConversationId,
  friends,
  requests,
  blocked,
  friendUsername,
  busy,
  onSectionChange,
  onOpenConversation,
  onFriendUsernameChange,
  onAddFriend,
  onBlockContact,
  onRespondFriendRequest,
  onUnblockContact,
  onStatusChange,
  onClearCache,
  onLogout,
}: DesktopSidebarProps) {
  const user = session.user;
  if (!user) return null;

  return (
    <aside className="sidebar">
      <div className="profile">
        <div className="avatar">
          {user.displayName.slice(0, 1).toUpperCase()}
        </div>
        <div>
          <strong>{user.displayName}</strong>
          <select
            aria-label="Trạng thái"
            value={user.status}
            onChange={(event) =>
              void onStatusChange(
                event.target.value as
                  | "online"
                  | "away"
                  | "busy"
                  | "invisible",
              )
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
          type="button"
          className={section === "chats" ? "selected" : ""}
          onClick={() => onSectionChange("chats")}
        >
          Trò chuyện
        </button>
        <button
          type="button"
          className={section === "contacts" ? "selected" : ""}
          onClick={() => onSectionChange("contacts")}
        >
          Danh bạ
        </button>
      </div>

      {section === "chats" ? (
        <nav aria-label="Danh sách trò chuyện">
          {conversations.map((conversation) => (
            <button
              type="button"
              className={
                conversation.id === activeConversationId
                  ? "conversation active"
                  : "conversation"
              }
              key={conversation.id}
              onClick={() => onOpenConversation(conversation)}
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
          <form className="addFriend" onSubmit={onAddFriend}>
            <input
              aria-label="Tên người dùng"
              placeholder="Thêm bằng username"
              value={friendUsername}
              onChange={(event) => onFriendUsernameChange(event.target.value)}
            />
            <button type="submit">+</button>
          </form>

          <h3>Trực tuyến</h3>
          {friends
            .filter((friend) => friend.status === "online")
            .map((friend) => (
              <DesktopContactRow
                key={friend.userId}
                friend={friend}
                onBlock={onBlockContact}
              />
            ))}

          <h3>Ngoại tuyến</h3>
          {friends
            .filter((friend) => friend.status !== "online")
            .map((friend) => (
              <DesktopContactRow
                key={friend.userId}
                friend={friend}
                onBlock={onBlockContact}
              />
            ))}

          {requests.incoming.length > 0 && <h3>Lời mời đến</h3>}
          {requests.incoming.map((request) => (
            <div className="requestRow" key={request.requestId}>
              <span>{request.senderDisplayName}</span>
              <button
                type="button"
                onClick={() =>
                  void onRespondFriendRequest(request.requestId, "accept")
                }
              >
                ✓
              </button>
              <button
                type="button"
                onClick={() =>
                  void onRespondFriendRequest(request.requestId, "reject")
                }
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
                type="button"
                onClick={() =>
                  void onRespondFriendRequest(request.requestId, "cancel")
                }
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
                type="button"
                onClick={() => void onUnblockContact(item.userId)}
              >
                Bỏ chặn
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="sidebarFooter">
        <button type="button" onClick={onClearCache}>
          Xóa cache
        </button>
        <button type="button" disabled={busy} onClick={onLogout}>
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}

