import { useEffect, useRef, useState } from "react";
import type { CallState, CallType } from "../features/calls";
import {
  IconPhone,
  IconVideo,
  IconMicrophone,
  IconMicrophoneMuted,
  IconCheck,
  IconCross,
  YahooLogoIcon,
} from "../icons/DesktopIcons";

export interface DesktopCallOverlayProps {
  callState: CallState;
  callType: CallType;
  callerName: string;
  isMuted: boolean;
  isVideoOff: boolean;
  localStream?: MediaStream | null;
  remoteStream?: MediaStream | null;
  durationFormatted?: string;
  localAudioLevel?: number;
  remoteAudioLevel?: number;
  onAccept: () => void;
  onDecline: () => void;
  onLeave: () => void;
  onToggleMute: () => void;
  onToggleVideo: () => void;
}

function RetroVuMeter({ level, label }: { level: number; label: string }) {
  const TOTAL_SEGMENTS = 10;
  const activeCount = Math.min(
    TOTAL_SEGMENTS,
    Math.round((level / 100) * TOTAL_SEGMENTS),
  );

  return (
    <div className="retroVuMeterContainer" title={`${label}: ${level}%`}>
      <span className="retroVuLabel">{label}</span>
      <div className="retroVuBar">
        {Array.from({ length: TOTAL_SEGMENTS }).map((_, idx) => {
          const isActive = idx < activeCount;
          let segColor = "green";
          if (idx >= 8) segColor = "red";
          else if (idx >= 6) segColor = "yellow";

          return (
            <div
              key={idx}
              className={`retroVuSeg retroVuSeg-${segColor} ${isActive ? "active" : ""}`}
            />
          );
        })}
      </div>
    </div>
  );
}

export function DesktopCallOverlay({
  callState,
  callType,
  callerName,
  isMuted,
  isVideoOff,
  localStream,
  remoteStream,
  durationFormatted = "00:00",
  localAudioLevel = 0,
  remoteAudioLevel = 0,
  onAccept,
  onDecline,
  onLeave,
  onToggleMute,
  onToggleVideo,
}: DesktopCallOverlayProps) {
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const [volume, setVolume] = useState(85);

  useEffect(() => {
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = localStream ?? null;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream ?? null;
    }
  }, [remoteStream]);

  if (callState === "idle") {
    return null;
  }

  return (
    <div className="callOverlayModal" data-testid="desktop-call-overlay">
      <div className="retroCallWindow">
        {/* Authentic Yahoo! Window Title Bar */}
        <div className="callWindowTitleBar">
          <div className="callWindowTitleLeft">
            <YahooLogoIcon size={14} style={{ marginRight: 6 }} />
            <span>
              Yahoo! Messenger -{" "}
              {callType === "video" ? "Webcam Video Call" : "Voice Chat"}
            </span>
          </div>
          <div className="callWindowControls">
            <button
              className="callWindowBtn"
              title="Thu nhỏ"
              onClick={onLeave}
            >
              _
            </button>
            <button
              className="callWindowBtn"
              title="Đóng"
              onClick={callState === "incoming" ? onDecline : onLeave}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Header Information Strip */}
        <div className="callWindowInfoStrip">
          <div className="callPartnerDetails">
            <span className="callPartnerName">{callerName}</span>
            <span className="callDuration">
              {callState === "connected"
                ? `Thời gian: ${durationFormatted}`
                : callState === "calling"
                  ? "Đang đổ chuông gọi đi…"
                  : callState === "incoming"
                    ? "Cuộc gọi đến từ Yahoo! Messenger…"
                    : "Đang ngắt kết nối…"}
            </span>
          </div>
          {callState === "connected" && (
            <div className="callStatusBadge connected">
              ● Trực tiếp ({callType.toUpperCase()})
            </div>
          )}
        </div>

        {/* Central Display Area: Video feeds or Voice visualizer */}
        <div className="callMediaViewport">
          {callType === "video" ? (
            <div className="videoStreamsContainer">
              {/* Main Remote Video Frame */}
              <div className="remoteVideoFrame">
                {remoteStream ? (
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="remoteVideoElement"
                  />
                ) : (
                  <div className="videoPlaceholder">
                    <IconVideo size={36} />
                    <span>Đang kết nối Webcam của {callerName}…</span>
                  </div>
                )}
                <div className="videoSuperBadge">Super Video 320x240</div>
              </div>

              {/* Picture-in-Picture Local Selfie Mirror */}
              <div
                className={`localVideoPip ${isVideoOff ? "videoMuted" : ""}`}
              >
                {localStream && !isVideoOff ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="localVideoElement"
                  />
                ) : (
                  <div className="pipMutedNotice">
                    <IconVideo size={16} />
                    <span>Tắt Camera</span>
                  </div>
                )}
                <span className="pipLabel">Bạn</span>
              </div>
            </div>
          ) : (
            <div className="voiceChatViewport">
              <div className="voiceAvatarPulse">
                <IconPhone size={48} />
              </div>
              <h3>{callerName}</h3>
              <p className="voiceChatSubtext">
                {callState === "connected"
                  ? "Cuộc trò chuyện thoại chất lượng cao đang diễn ra"
                  : "Đang kết nối đường truyền thoại Yahoo!..."}
              </p>

              {/* Dual VU Meter for Voice Chat */}
              <div className="voiceVuRow">
                <RetroVuMeter level={localAudioLevel} label="Mic Bạn" />
                <RetroVuMeter level={remoteAudioLevel} label="Mic Bạn bè" />
              </div>
            </div>
          )}
        </div>

        {/* Audio Volume & Hardware Equalizer */}
        <div className="callAudioBar">
          <div className="audioVolumeControl">
            <label htmlFor="callVolRange">Âm lượng:</label>
            <input
              id="callVolRange"
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
            />
            <span className="volumePercent">{volume}%</span>
          </div>

          {callType === "video" && (
            <div className="miniVuMeters">
              <RetroVuMeter level={localAudioLevel} label="Mic" />
              <RetroVuMeter level={remoteAudioLevel} label="Loa" />
            </div>
          )}
        </div>

        {/* Control Action Toolbar */}
        <div className="callActionBar">
          {callState === "incoming" ? (
            <div className="incomingActionRow">
              <button
                className="retroCallBtn acceptBtn"
                onClick={onAccept}
                title="Trả lời cuộc gọi"
              >
                <IconCheck size={16} />
                <span>Nhận cuộc gọi</span>
              </button>
              <button
                className="retroCallBtn declineBtn"
                onClick={onDecline}
                title="Từ chối cuộc gọi"
              >
                <IconCross size={16} />
                <span>Từ chối</span>
              </button>
            </div>
          ) : (
            <div className="activeActionRow">
              <button
                className={`retroCallToolBtn ${isMuted ? "muted" : ""}`}
                onClick={onToggleMute}
                title={isMuted ? "Bật micro" : "Tắt micro"}
              >
                {isMuted ? (
                  <IconMicrophoneMuted size={16} />
                ) : (
                  <IconMicrophone size={16} />
                )}
                <span>{isMuted ? "Bật Mic" : "Tắt Mic"}</span>
              </button>

              {callType === "video" && (
                <button
                  className={`retroCallToolBtn ${isVideoOff ? "muted" : ""}`}
                  onClick={onToggleVideo}
                  title={isVideoOff ? "Bật webcam" : "Tắt webcam"}
                >
                  <IconVideo size={16} />
                  <span>{isVideoOff ? "Bật Cam" : "Tắt Cam"}</span>
                </button>
              )}

              <button
                className="retroCallBtn hangupBtn"
                onClick={onLeave}
                title="Kết thúc cuộc gọi"
              >
                <IconPhone size={16} />
                <span>Gác máy</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

