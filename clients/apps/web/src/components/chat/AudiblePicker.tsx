import { YAHOO_AUDIBLES, type YahooAudibleDefinition } from "@retro/design-tokens";
import { IconBuzz, IconAudibles } from "../../icons/UiIcons";
import { SmileyKiss, SmileyGrin, SmileyWink } from "../../icons/YahooSmileys";

function getAudibleIcon(id: string) {
  switch (id) {
    case "buzz":
      return <IconBuzz size={16} />;
    case "hey":
      return <IconAudibles size={16} />;
    case "missyou":
      return <SmileyKiss size={16} />;
    case "woohoo":
    case "laugh":
      return <SmileyGrin size={16} />;
    case "byebye":
    default:
      return <SmileyWink size={16} />;
  }
}

export interface AudiblePickerProps {
  onSelectAudible: (audible: YahooAudibleDefinition) => void;
  onClose: () => void;
}

export function AudiblePicker({
  onSelectAudible,
  onClose,
}: AudiblePickerProps) {
  return (
    <div
      className="audibleGridPopup"
      role="dialog"
      aria-label="Yahoo! Audibles"
    >
      <div className="audibleHeader">
        <span>Yahoo! Audibles</span>
        <button type="button" className="closePopupBtn" onClick={onClose}>
          ✕
        </button>
      </div>
      <div className="audibleList">
        {YAHOO_AUDIBLES.map((audible) => (
          <button
            key={audible.id}
            type="button"
            className="audibleItem"
            onClick={() => {
              onSelectAudible(audible);
              onClose();
            }}
          >
            <span className="audibleIcon" style={{ display: "inline-flex", alignItems: "center" }}>
              {getAudibleIcon(audible.id)}
            </span>
            <span className="audibleTitle">{audible.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

