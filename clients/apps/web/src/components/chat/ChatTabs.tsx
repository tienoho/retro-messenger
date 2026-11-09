import type { ConversationDto } from "@retro/contracts";
import { StatusDotOnline } from "../../icons/UiIcons";

export interface ChatTabsProps {
  tabs: ConversationDto[];
  activeId?: string | null | undefined;
  onSelectTab: (conv: ConversationDto) => void;
  onCloseTab: (id: string) => void;
}

export function ChatTabs({
  tabs,
  activeId,
  onSelectTab,
  onCloseTab,
}: ChatTabsProps) {
  if (tabs.length === 0) return null;

  return (
    <nav className="webChatTabsStrip" aria-label="Các tab trò chuyện Yahoo!">
      {tabs.map((tab) => {
        const isActive = tab.id === activeId;
        return (
          <div
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            className={`webChatTab ${isActive ? "active" : ""}`}
            onClick={() => onSelectTab(tab)}
            title={tab.title}
          >
            <span className="tabDot">
              <StatusDotOnline size={8} />
            </span>
            <span className="tabLabel">{tab.title}</span>
            <button
              type="button"
              className="tabCloseBtn"
              title="Đóng tab này"
              onClick={(e) => {
                e.stopPropagation();
                onCloseTab(tab.id);
              }}
            >
              ✕
            </button>
          </div>
        );
      })}
    </nav>
  );
}

