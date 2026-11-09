import React, { useEffect, useRef, useState } from "react";
import type { CallState, CallType } from "../../features/calls";
import {
  IconPhone,
  IconVideo,
  IconMicrophone,
  IconMicrophoneMuted,
  IconCheck,
  IconCross,
  StatusDotBusy,
  StatusDotAvailable,
  YahooLogoIcon,
  IconBuzz,
} from "../../icons/UiIcons";

export interface CallOverlayProps {
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

export function CallOverlay({
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
}: CallOverlayProps) {
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
    <div className="callOverlayModal" data-testid="call-overlay">
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
              title="Minimize"
              onClick={onLeave}
            >
              _
            </button>
            <button className="callWindowBtn" title="Maximize">
              □
            </button>
            <button
              className="callWindowBtn closeBtn"
              title="Đóng / Gác máy"
              onClick={callState === "incoming" ? onDecline : onLeave}
            >
              <IconCross size={10} />
            </button>
          </div>
        </div>

        {/* 1. Incoming Call Dialog */}
        {callState === "incoming" && (
          <div className="callIncomingBox">
            <div className="callIncomingAvatar">
              {callType === "video" ? (
                <IconVideo size={36} color="#5b1e84" />
              ) : (
                <IconPhone size={36} color="#5b1e84" />
              )}
            </div>
            <h3 className="callDialogTitle">Cuộc gọi đến...</h3>
            <p className="callDialogText">
              <strong>{callerName}</strong> đang gọi cho bạn bằng{" "}
              <span className="callTypeHighlight">
                {callType === "video" ? "Webcam Video" : "Voice Thoại"}
              </span>
              .
            </p>
            <div className="callActions">
              <button
                className="acceptCallBtn retroBtn"
                onClick={onAccept}
                title="Trả lời cuộc gọi"
              >
                <IconCheck size={14} style={{ marginRight: 6 }} />
                Trả lời {callType === "video" ? "Video" : "Thoại"}
              </button>
              <button
                className="declineCallBtn retroBtn"
                onClick={onDecline}
                title="Từ chối cuộc gọi"
              >
                <IconCross size={14} style={{ marginRight: 6 }} />
                Từ chối
              </button>
            </div>
          </div>
        )}

        {/* 2. Outgoing Calling Dialog */}
        {callState === "calling" && (
          <div className="callOutgoingBox">
            <div className="callCallingAnimation">
              {callType === "video" ? (
                <IconVideo size={34} color="#ffd700" />
              ) : (
                <IconPhone size={34} color="#ffd700" />
              )}
            </div>
            <h3 className="callDialogTitle">Đang đổ chuông...</h3>
            <p className="callDialogText">
              Đang gọi tới <strong>{callerName}</strong>
            </p>
            <div className="callingPulseIndicator">
              <span className="pulseDot dot1" />
              <span className="pulseDot dot2" />
              <span className="pulseDot dot3" />
            </div>
            <div className="callActions">
              <button
                className="declineCallBtn retroBtn"
                onClick={onLeave}
                title="Hủy cuộc gọi"
              >
                <IconCross size={14} style={{ marginRight: 6 }} />
                Hủy cuộc gọi
              </button>
            </div>
          </div>
        )}

        {/* 3. Connected Active Call Window */}
        {callState === "connected" && (
          <div className="callActiveBox">
            {/* Status Bar */}
            <div className="callActiveHeader">
              <div className="callHeaderStatus">
                <StatusDotAvailable size={10} style={{ marginRight: 6 }} />
                <span>Đang kết nối: {callerName}</span>
              </div>
              <div className="callHeaderTimer">
                <span className="timerBadge">{durationFormatted}</span>
              </div>
            </div>

            {/* Viewport for Video or Voice */}
            {callType === "video" ? (
              <div className="callVideoViewport">
                {/* Main Remote Video */}
                <div className="remoteVideoFrame">
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="remoteVideoElement"
                  />
                  <div className="videoOverlaySuperBadge">
                    <span>SUPER VIDEO</span>
                    <span className="superVideoFps">15.0 fps</span>
                  </div>
                  <div className="videoOverlayCallerTag">
                    <span>{callerName}</span>
                  </div>
                </div>

                {/* Local Video PIP (Picture-In-Picture) */}
                <div className="localVideoPip">
                  {isVideoOff ? (
                    <div className="videoOffPlaceholder">
                      <IconVideo size={16} color="#aaa" />
                      <span>Cam Tắt</span>
                    </div>
                  ) : (
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="localVideoElement"
                    />
                  )}
                  <span className="localPipBadge">Bạn</span>
                </div>
              </div>
            ) : (
              /* Voice Call Viewport */
              <div className="callVoiceViewport">
                <div className="voiceCard voiceCardSelf">
                  <div className="voiceAvatarIcon">
                    <IconMicrophone
                      size={24}
                      color={isMuted ? "#888" : "#28a745"}
                    />
                  </div>
                  <div className="voiceInfo">
                    <span className="voiceUserName">Bạn (Local)</span>
                    <span className="voiceUserStatus">
                      {isMuted ? "Đang Tắt Mic" : "Đang Phát Biểu"}
                    </span>
                    <RetroVuMeter level={isMuted ? 0 : localAudioLevel} label="Mic" />
                  </div>
                </div>

                <div className="voiceDivider">
                  <IconBuzz size={18} />
                </div>

                <div className="voiceCard voiceCardRemote">
                  <div className="voiceAvatarIcon">
                    <IconPhone size={24} color="#ffd700" />
                  </div>
                  <div className="voiceInfo">
                    <span className="voiceUserName">{callerName}</span>
                    <span className="voiceUserStatus">Đang Kết Nối</span>
                    <RetroVuMeter level={remoteAudioLevel} label="Loa" />
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Controls Bar */}
            <div className="callControlsBar">
              {/* Mic Mute Button */}
              <button
                className={`retroControlBtn ${isMuted ? "btnMuted" : ""}`}
                onClick={onToggleMute}
                title={isMuted ? "Bật Microphone" : "Tắt Microphone"}
              >
                {isMuted ? (
                  <>
                    <IconMicrophoneMuted size={14} style={{ marginRight: 6 }} />
                    Bật Mic
                  </>
                ) : (
                  <>
                    <IconMicrophone size={14} style={{ marginRight: 6 }} />
                    Tắt Mic
                  </>
                )}
              </button>

              {/* Camera Toggle Button (if Video Call) */}
              {callType === "video" && (
                <button
                  className={`retroControlBtn ${isVideoOff ? "btnVideoOff" : ""}`}
                  onClick={onToggleVideo}
                  title={isVideoOff ? "Bật Webcam" : "Tắt Webcam"}
                >
                  <IconVideo size={14} style={{ marginRight: 6 }} />
                  {isVideoOff ? "Bật Cam" : "Tắt Cam"}
                </button>
              )}

              {/* Volume Slider */}
              <div className="callVolumeControl" title={`Âm lượng: ${volume}%`}>
                <IconPhone size={12} style={{ marginRight: 4, opacity: 0.8 }} />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="retroVolumeSlider"
                />
              </div>

              {/* End Call Button */}
              <button
                className="endCallBtn retroBtn"
                onClick={onLeave}
                title="Gác máy / Kết thúc cuộc gọi"
              >
                <StatusDotBusy size={10} style={{ marginRight: 6 }} />
                Gác Máy
              </button>
            </div>
          </div>
        )}

        {/* 4. Call Ended Dialog */}
        {callState === "ended" && (
          <div className="callEndedBox">
            <div className="callEndedIcon">
              <StatusDotBusy size={24} color="#d9534f" />
            </div>
            <h3 className="callDialogTitle">Cuộc gọi đã kết thúc</h3>
            <p className="callDialogSubtext">
              Thời lượng cuộc gọi: <strong>{durationFormatted}</strong>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
