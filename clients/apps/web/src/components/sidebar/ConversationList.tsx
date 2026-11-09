import { useState } from "react";
import type { ConversationDto } from "@retro/contracts";
import { StatusDotOnline } from "../../icons/UiIcons";

export interface ConversationListProps {
  conversations: ConversationDto[];
  activeId: string | null;
  onSelect: (conversation: ConversationDto) => void;
  onOpenContactsTab: () => void;
}

export function ConversationList({
  conversations,
  activeId,
  onSelect,
  onOpenContactsTab,
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = conversations.filter(
    item =>
      !searchQuery.trim() ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <>
      <div className="searchBox">
        <input
          className="searchInput"
          placeholder="Tìm bạn bè hoặc cuộc trò chuyện..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="buddyContainer">
        <div className="categoryGroup">
          <div className="categoryHeader">
            <span>▼ Cuộc trò chuyện đang mở ({conversations.length})</span>
          </div>
          <div className="categoryItems">
            {filtered.map(item => (
              <button
                key={item.id}
                className={`buddyItem ${activeId === item.id ? "active" : ""}`}
                onClick={() => onSelect(item)}
              >
                <span className="buddySmiley">
                  <StatusDotOnline size={12} />
                </span>
                <div className="buddyInfo">
                  <span className="buddyName">{item.title}</span>
                  <span className="buddyStatusText">Trực tuyến</span>
                </div>
              </button>
            ))}
            {conversations.length === 0 && (
              <div
                style={{
                  color: "#888",
                  padding: "16px 12px",
                  textAlign: "center",
                  fontSize: "11px",
                  lineHeight: "1.5",
                }}
              >
                Chưa có cuộc trò chuyện. Hãy chọn bạn bè trong{" "}
                <span
                  style={{ color: "var(--yahoo-purple)", textDecoration: "underline", cursor: "pointer" }}
                  onClick={onOpenContactsTab}
                >
                  Danh bạ
                </span>{" "}
                để bắt đầu!
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

