import React from "react";
import type { CallState, CallType } from "../../features/calls";

export interface CallOverlayProps {
  callState: CallState;
  callType: CallType;
  callerName: string;
  isMuted: boolean;
  isVideoOff: boolean;
  onAccept: () => void;
  onDecline: () => void;
  onLeave: () => void;
  onToggleMute: () => void;
  onToggleVideo: () => void;
}

export function CallOverlay({
  callState,
  callType,
  callerName,
  isMuted,
  isVideoOff,
  onAccept,
  onDecline,
  onLeave,
  onToggleMute,
  onToggleVideo,
}: CallOverlayProps) {
  if (callState === "idle") {
    return null;
  }

  return (
    <div className="callOverlayModal" data-testid="call-overlay">
      <div className="callOverlayContainer">
        {callState === "incoming" && (
          <div className="callIncomingBox">
            <h3>📞 Cuộc gọi đến...</h3>
            <p>
              <strong>{callerName}</strong> đang gọi cho bạn ({callType === "video" ? "Video Call" : "Audio Call"}).
            </p>
            <div className="callActions">
              <button className="acceptCallBtn" onClick={onAccept}>
                ✅ Trả lời
              </button>
              <button className="declineCallBtn" onClick={onDecline}>
                ❌ Từ chối
              </button>
            </div>
          </div>
        )}

        {callState === "calling" && (
          <div className="callOutgoingBox">
            <h3>📡 Đang kết nối cuộc gọi...</h3>
            <p>Đang gọi tới <strong>{callerName}</strong>...</p>
            <div className="callActions">
              <button className="declineCallBtn" onClick={onLeave}>
                🔴 Hủy cuộc gọi
              </button>
            </div>
          </div>
        )}

        {callState === "connected" && (
          <div className="callActiveBox">
            <header className="callHeader">
              <span>{callType === "video" ? "📹 Video Call" : "🎙️ Audio Call"}</span>
              <span>Đang kết nối: {callerName}</span>
            </header>

            <div className="callMediaViewport">
              {callType === "video" ? (
                <div className={`videoPlaceholder ${isVideoOff ? "videoOff" : ""}`}>
                  {isVideoOff ? (
                    <div className="avatarPlaceholder">📷 Camera Tắt</div>
                  ) : (
                    <div className="videoFeed">🎥 Video Active ({callerName})</div>
                  )}
                </div>
              ) : (
                <div className="audioPlaceholder">
                  <div className="audioWave">🎙️ Live Audio Stream</div>
                </div>
              )}
            </div>

            <footer className="callControls">
              <button
                className={`controlBtn ${isMuted ? "activeMute" : ""}`}
                onClick={onToggleMute}
                title={isMuted ? "Bật Mic" : "Tắt Mic"}
              >
                {isMuted ? "🔇 Unmute" : "🎙️ Mute"}
              </button>

              {callType === "video" && (
                <button
                  className={`controlBtn ${isVideoOff ? "activeVideoOff" : ""}`}
                  onClick={onToggleVideo}
                  title={isVideoOff ? "Bật Camera" : "Tắt Camera"}
                >
                  {isVideoOff ? "📷 Cam On" : "📹 Cam Off"}
                </button>
              )}

              <button className="endCallBtn" onClick={onLeave} title="Kết thúc cuộc gọi">
                🔴 Kết thúc
              </button>
            </footer>
          </div>
        )}

        {callState === "ended" && (
          <div className="callEndedBox">
            <h3>🔴 Cuộc gọi đã kết thúc</h3>
          </div>
        )}
      </div>
    </div>
  );
}
