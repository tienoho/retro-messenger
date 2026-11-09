import { useState, type FormEvent } from "react";
import type {
  BlockedContactDto,
  ContactRequestStateDto,
  FriendDto,
} from "@retro/contracts";
import {
  IconChat,
  IconBuzz,
  IconPhone,
  IconBell,
  IconBlock,
  StatusDotOnline,
  StatusDotInvisible,
} from "../../icons/UiIcons";

export interface BuddyListProps {
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
  onSendBuzz?: ((userId: string) => void) | undefined;
  onStartCall?: ((userId: string, displayName: string) => void) | undefined;
}

export function BuddyList({
  friends,
  requests,
  blocked,
  onAddFriend,
  onRespondRequest,
  onUnblock,
  onStartChat,
  onSendBuzz,
  onStartCall,
}: BuddyListProps) {
  const [filterQuery, setFilterQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newFriendUsername, setNewFriendUsername] = useState("");
  const [onlineOpen, setOnlineOpen] = useState(true);
  const [offlineOpen, setOfflineOpen] = useState(true);
  const [requestsOpen, setRequestsOpen] = useState(true);
  const [blockedOpen, setBlockedOpen] = useState(false);

  const handleAddSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!newFriendUsername.trim()) return;
    const ok = await onAddFriend(newFriendUsername.trim());
    if (ok) {
      setNewFriendUsername("");
      setShowAddForm(false);
    }
  };

  const filteredFriends = friends.filter((f) => {
    if (!filterQuery.trim()) return true;
    const q = filterQuery.toLowerCase();
    return (
      f.displayName.toLowerCase().includes(q) ||
      f.username.toLowerCase().includes(q)
    );
  });

  const onlineFriends = filteredFriends.filter((f) => f.status === "online");
  const offlineFriends = filteredFriends.filter((f) => f.status !== "online");

  return (
    <>
      {/* Quick Search & Add Form Controls */}
      <div className="buddyControlsStrip">
        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1, minWidth: 0 }}>
            <input
              className="searchInput"
              style={{ width: "100%", paddingRight: filterQuery ? "24px" : "8px" }}
              placeholder="🔍 Lọc danh bạ bạn bè..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
            />
            {filterQuery && (
              <button
                type="button"
                onClick={() => setFilterQuery("")}
                style={{
                  position: "absolute",
                  right: "6px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "#94a3b8",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: "bold",
                }}
                title="Xóa tìm kiếm"
              >
                ✕
              </button>
            )}
          </div>
          <button
            type="button"
            className="toolstripBtn"
            onClick={() => setShowAddForm((p) => !p)}
            title="Thêm bạn mới"
            style={{ flex: "none", padding: "5px 10px", fontSize: "11px" }}
          >
            {showAddForm ? "Ẩn" : "+ Thêm"}
          </button>
        </div>

        {showAddForm && (
          <form
            onSubmit={handleAddSubmit}
            style={{
              display: "flex",
              gap: "4px",
              marginTop: "6px",
              animation: "fadeInMsg 0.15s ease-out",
            }}
          >
            <input
              className="searchInput"
              placeholder="Nhập Yahoo! ID cần kết bạn..."
              value={newFriendUsername}
              onChange={(e) => setNewFriendUsername(e.target.value)}
              autoFocus
            />
            <button
              type="submit"
              className="toolstripBtn"
              style={{
                flex: "none",
                padding: "4px 8px",
                background: "#7c3aed",
                color: "#ffffff",
                border: "none",
              }}
            >
              Gửi lời mời
            </button>
          </form>
        )}
      </div>

      <div className="buddyContainer">

      {/* Friend Requests */}
      {requests.incoming.length > 0 && (
        <div className="categoryGroup">
          <div
            className="categoryHeader"
            style={{ color: "#cc0000" }}
            onClick={() => setRequestsOpen((p) => !p)}
          >
            <span>
              {requestsOpen ? "▼" : "▶"}{" "}
              <IconBell size={12} style={{ marginRight: 3, verticalAlign: "middle" }} />
              Lời mời kết bạn ({requests.incoming.length})
            </span>
          </div>
          {requestsOpen && (
            <div className="categoryItems">
              {requests.incoming.map((req) => (
                <div
                  key={req.requestId}
                  className="buddyItem"
                  style={{ justifyContent: "space-between" }}
                >
                  <div className="buddyInfo">
                    <span className="buddyName">{req.senderDisplayName}</span>
                    <span className="buddyStatusText">Muốn kết bạn</span>
                  </div>
                  <div style={{ display: "flex", gap: "3px", flexShrink: 0 }}>
                    <button
                      type="button"
                      className="toolstripBtn"
                      style={{ padding: "2px 6px", fontSize: "10px" }}
                      onClick={() =>
                        void onRespondRequest(req.requestId, "accept")
                      }
                    >
                      ✓ Đồng ý
                    </button>
                    <button
                      type="button"
                      className="toolstripBtn"
                      style={{ padding: "2px 6px", fontSize: "10px" }}
                      onClick={() =>
                        void onRespondRequest(req.requestId, "reject")
                      }
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Online Friends */}
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
              <div
                key={friend.userId}
                className="buddyItem"
                onClick={() =>
                  void onStartChat(friend.userId, friend.displayName)
                }
                onDoubleClick={() =>
                  void onStartChat(friend.userId, friend.displayName)
                }
                title="Nhấp để mở trò chuyện, nhấp đúp để vào ngay"
              >
                <span className="buddySmiley">
                  <StatusDotOnline size={12} />
                </span>
                <div className="buddyInfo">
                  <span className="buddyName">{friend.displayName}</span>
                  <span className="buddyStatusText">
                    @{friend.username} — Sẵn sàng trò chuyện
                  </span>
                </div>
                <div className="buddyQuickActions">
                  <button
                    type="button"
                    className="buddyActionBtn"
                    title="Gửi tin nhắn"
                    onClick={(e) => {
                      e.stopPropagation();
                      void onStartChat(friend.userId, friend.displayName);
                    }}
                  >
                    <IconChat size={11} />
                  </button>
                  {onSendBuzz && (
                    <button
                      type="button"
                      className="buddyActionBtn"
                      title="Gửi BUZZ!"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSendBuzz(friend.userId);
                      }}
                    >
                      <IconBuzz size={11} />
                    </button>
                  )}
                  {onStartCall && (
                    <button
                      type="button"
                      className="buddyActionBtn"
                      title="Gọi điện"
                      onClick={(e) => {
                        e.stopPropagation();
                        onStartCall(friend.userId, friend.displayName);
                      }}
                    >
                      <IconPhone size={11} />
                    </button>
                  )}
                </div>
              </div>
            ))}
            {onlineFriends.length === 0 && (
              <div
                style={{
                  color: "#999",
                  padding: "6px 12px",
                  fontSize: "11px",
                  fontStyle: "italic",
                }}
              >
                Không có ai trực tuyến
              </div>
            )}
          </div>
        )}
      </div>

      {/* Offline Friends */}
      <div className="categoryGroup">
        <div
          className="categoryHeader"
          onClick={() => setOfflineOpen((p) => !p)}
        >
          <span>
            {offlineOpen ? "▼" : "▶"} Bạn bè ngoại tuyến (
            {offlineFriends.length})
          </span>
        </div>
        {offlineOpen && (
          <div className="categoryItems">
            {offlineFriends.map((friend) => (
              <div
                key={friend.userId}
                className="buddyItem"
                onClick={() =>
                  void onStartChat(friend.userId, friend.displayName)
                }
                onDoubleClick={() =>
                  void onStartChat(friend.userId, friend.displayName)
                }
                title="Nhấp để gửi tin nhắn ngoại tuyến"
              >
                <span className="buddySmiley">
                  <StatusDotInvisible size={12} />
                </span>
                <div className="buddyInfo">
                  <span className="buddyName" style={{ color: "#777" }}>
                    {friend.displayName}
                  </span>
                  <span className="buddyStatusText">
                    @{friend.username} — Ngoại tuyến
                  </span>
                </div>
                <div className="buddyQuickActions">
                  <button
                    type="button"
                    className="buddyActionBtn"
                    title="Gửi tin nhắn ngoại tuyến"
                    onClick={(e) => {
                      e.stopPropagation();
                      void onStartChat(friend.userId, friend.displayName);
                    }}
                  >
                    <IconChat size={11} />
                  </button>
                </div>
              </div>
            ))}
            {offlineFriends.length === 0 && (
              <div
                style={{
                  color: "#999",
                  padding: "6px 12px",
                  fontSize: "11px",
                  fontStyle: "italic",
                }}
              >
                Không có ai ngoại tuyến
              </div>
            )}
          </div>
        )}
      </div>

      {/* Blocked List */}
      {blocked.length > 0 && (
        <div className="categoryGroup">
          <div
            className="categoryHeader"
            style={{ color: "#999" }}
            onClick={() => setBlockedOpen((p) => !p)}
          >
            <span>
              {blockedOpen ? "▼" : "▶"}{" "}
              <IconBlock size={12} style={{ marginRight: 3, verticalAlign: "middle" }} />
              Danh sách chặn ({blocked.length})
            </span>
          </div>
          {blockedOpen && (
            <div className="categoryItems">
              {blocked.map((b) => (
                <div
                  key={b.userId}
                  className="buddyItem"
                  style={{ justifyContent: "space-between" }}
                >
                  <span className="buddyName" style={{ color: "#888", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {b.displayName}
                  </span>
                  <button
                    type="button"
                    className="toolstripBtn"
                    style={{ padding: "2px 6px", fontSize: "10px" }}
                    onClick={() => void onUnblock(b.userId)}
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
    </>
  );
}
