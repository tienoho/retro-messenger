import type { ConversationDto } from "@retro/contracts";
import { StatusDotOnline } from "../icons/DesktopIcons";

export interface DesktopChatTabsProps {
  tabs: ConversationDto[];
  activeId?: string | undefined;
  onSelectTab: (conv: ConversationDto) => void;
  onCloseTab: (id: string) => void;
}

export function DesktopChatTabs({
  tabs,
  activeId,
  onSelectTab,
  onCloseTab,
}: DesktopChatTabsProps) {
  if (tabs.length === 0) return null;

  return (
    <nav className="desktopChatTabsStrip" aria-label="Các tab trò chuyện">
      {tabs.map((tab) => {
        const isActive = tab.id === activeId;
        return (
          <div
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            className={`desktopChatTab ${isActive ? "active" : ""}`}
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

