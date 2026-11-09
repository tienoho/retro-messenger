import { useState, type FormEvent } from "react";
import type {
  BlockedContactDto,
  ContactRequestStateDto,
  ConversationDto,
  FriendDto,
} from "@retro/contracts";
import type { DesktopSessionState } from "../../shared/ipc-contracts.ts";
import { IconPencil, StatusDotOnline } from "../icons/DesktopIcons";
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
  onStartChat?: ((friend: FriendDto) => void) | undefined;
  onEditCustomStatus?: (() => void) | undefined;
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
  onSendBuzz?: ((userId: string) => void) | undefined;
  onStartCall?: ((userId: string, displayName: string) => void) | undefined;
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
  onStartChat,
  onEditCustomStatus,
  onFriendUsernameChange,
  onAddFriend,
  onBlockContact,
  onRespondFriendRequest,
  onUnblockContact,
  onStatusChange,
  onSendBuzz,
  onStartCall,
  onClearCache,
  onLogout,
}: DesktopSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [onlineOpen, setOnlineOpen] = useState(true);
  const [offlineOpen, setOfflineOpen] = useState(true);
  const [requestsOpen, setRequestsOpen] = useState(true);
  const [blockedOpen, setBlockedOpen] = useState(false);

  const user = session.user;
  if (!user) return null;

  const filteredConversations = conversations.filter(
    (c) =>
      !searchQuery.trim() ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredFriends = friends.filter(
    (f) =>
      !searchQuery.trim() ||
      f.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.username.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const onlineFriends = filteredFriends.filter((f) => f.status === "online");
  const offlineFriends = filteredFriends.filter((f) => f.status !== "online");

  return (
    <aside className="sidebar">
      {/* 1. Profile Strip */}
      <div className="profile">
        <div className="avatar">
          {user.displayName.slice(0, 1).toUpperCase()}
        </div>
        <div className="profileInfo">
          <div className="profileNameRow">
            <strong title={user.displayName}>{user.displayName}</strong>
            {onEditCustomStatus && (
              <button
                type="button"
                className="editStatusIconBtn"
                title="Đổi lời nhắn cá nhân"
                onClick={onEditCustomStatus}
              >
                <IconPencil size={11} />
              </button>
            )}
          </div>
          {user.customStatus ? (
            <div
              className="customStatusBubble"
              title={user.customStatus}
              onClick={onEditCustomStatus}
            >
              &ldquo;{user.customStatus}&rdquo;
            </div>
          ) : (
            onEditCustomStatus && (
              <div
                className="customStatusPlaceholder"
                onClick={onEditCustomStatus}
              >
                + Đặt lời nhắn trạng thái…
              </div>
            )
          )}
          <select
            aria-label="Trạng thái"
            className="statusSelect"
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
            <option value="online">● Trực tuyến</option>
            <option value="away">● Vắng mặt</option>
            <option value="busy">● Bận</option>
            <option value="invisible">○ Ẩn</option>
          </select>
        </div>
      </div>

      {/* 2. Section Tabs (Trò chuyện / Danh bạ) */}
      <div className="sectionTabs">
        <button
          type="button"
          className={section === "chats" ? "selected" : ""}
          onClick={() => onSectionChange("chats")}
        >
          Trò chuyện ({conversations.length})
        </button>
        <button
          type="button"
          className={section === "contacts" ? "selected" : ""}
          onClick={() => onSectionChange("contacts")}
        >
          Danh bạ ({friends.length})
        </button>
      </div>

      {/* 3. Search Box */}
      <div className="buddySearchContainer">
        <input
          type="text"
          className="buddySearchInput"
          placeholder={
            section === "chats"
              ? "Tìm cuộc trò chuyện..."
              : "Tìm bạn bè trong danh bạ..."
          }
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* 4. Main Panel Content */}
      {section === "chats" ? (
        <nav className="conversationsList" aria-label="Danh sách trò chuyện">
          <div className="categoryGroup">
            <div className="categoryHeader">
              <span>▼ Cuộc trò chuyện đang mở ({filteredConversations.length})</span>
            </div>
            <div className="categoryItems">
              {filteredConversations.map((conversation) => (
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
                  <div className="conversationMeta">
                    <span className="conversationTitle">{conversation.title}</span>
                  </div>
                </button>
              ))}
              {filteredConversations.length === 0 && (
                <div className="emptyListHint">
                  Không có cuộc trò chuyện nào phù hợp.
                </div>
              )}
            </div>
          </div>
        </nav>
      ) : (
        <div className="contactsPanel">
          {/* Add Friend Row */}
          <form className="addFriendForm" onSubmit={onAddFriend}>
            <input
              className="addFriendInput"
              aria-label="Tên người dùng"
              placeholder="Nhập Yahoo! ID cần kết bạn..."
              value={friendUsername}
              onChange={(event) => onFriendUsernameChange(event.target.value)}
            />
            <button type="submit" className="addFriendBtn" title="Thêm bạn">+</button>
          </form>

          {/* Incoming Requests */}
          {requests.incoming.length > 0 && (
            <div className="categoryGroup">
              <div
                className="categoryHeader"
                style={{ color: "#cc0000" }}
                onClick={() => setRequestsOpen((p) => !p)}
              >
                <span>
                  {requestsOpen ? "▼" : "▶"} Lời mời kết bạn ({requests.incoming.length})
                </span>
              </div>
              {requestsOpen && (
                <div className="categoryItems">
                  {requests.incoming.map((request) => (
                    <div className="requestRow" key={request.requestId}>
                      <span>{request.senderDisplayName}</span>
                      <div className="requestActions">
                        <button
                          type="button"
                          className="requestBtn accept"
                          title="Đồng ý kết bạn"
                          onClick={() =>
                            void onRespondFriendRequest(request.requestId, "accept")
                          }
                        >
                          ✓
                        </button>
                        <button
                          type="button"
                          className="requestBtn reject"
                          title="Từ chối"
                          onClick={() =>
                            void onRespondFriendRequest(request.requestId, "reject")
                          }
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Online Friends Accordion */}
          <div className="categoryGroup">
            <div
              className="categoryHeader"
              onClick={() => setOnlineOpen((p) => !p)}
            >
              <span>
                {onlineOpen ? "▼" : "▶"} Bạn bè trực tuyến ({onlineFriends.length})
              </span>
            </div>
            {onlineOpen && (
              <div className="categoryItems">
                {onlineFriends.map((friend) => (
                  <DesktopContactRow
                    key={friend.userId}
                    friend={friend}
                    onBlock={onBlockContact}
                    onStartChat={onStartChat}
                    onSendBuzz={onSendBuzz}
                    onStartCall={onStartCall}
                  />
                ))}
                {onlineFriends.length === 0 && (
                  <div className="emptyCategoryHint">
                    Không có ai trực tuyến
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Offline Friends Accordion */}
          <div className="categoryGroup">
            <div
              className="categoryHeader"
              onClick={() => setOfflineOpen((p) => !p)}
            >
              <span>
                {offlineOpen ? "▼" : "▶"} Bạn bè ngoại tuyến ({offlineFriends.length})
              </span>
            </div>
            {offlineOpen && (
              <div className="categoryItems">
                {offlineFriends.map((friend) => (
                  <DesktopContactRow
                    key={friend.userId}
                    friend={friend}
                    onBlock={onBlockContact}
                    onStartChat={onStartChat}
                    onSendBuzz={onSendBuzz}
                    onStartCall={onStartCall}
                  />
                ))}
                {offlineFriends.length === 0 && (
                  <div className="emptyCategoryHint">
                    Không có ai ngoại tuyến
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Outgoing Requests */}
          {requests.outgoing.length > 0 && (
            <div className="categoryGroup">
              <div className="categoryHeader">
                <span>▼ Đang chờ phản hồi ({requests.outgoing.length})</span>
              </div>
              <div className="categoryItems">
                {requests.outgoing.map((request) => (
                  <div className="requestRow" key={request.requestId}>
                    <span>{request.recipientDisplayName}</span>
                    <button
                      type="button"
                      className="requestBtn cancel"
                      onClick={() =>
                        void onRespondFriendRequest(request.requestId, "cancel")
                      }
                    >
                      Hủy
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Blocked Contacts */}
          {blocked.length > 0 && (
            <div className="categoryGroup">
              <div
                className="categoryHeader"
                onClick={() => setBlockedOpen((p) => !p)}
              >
                <span>
                  {blockedOpen ? "▼" : "▶"} Đã chặn ({blocked.length})
                </span>
              </div>
              {blockedOpen && (
                <div className="categoryItems">
                  {blocked.map((item) => (
                    <div className="requestRow" key={item.userId}>
                      <span>{item.displayName}</span>
                      <button
                        type="button"
                        className="requestBtn cancel"
                        onClick={() => void onUnblockContact(item.userId)}
                      >
                        Bỏ chặn
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 5. Footer Actions */}
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
