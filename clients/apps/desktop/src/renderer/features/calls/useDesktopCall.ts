import { useState, useEffect, useCallback, useRef } from "react";
import type {
  CallEndedEvent,
  CallStartedEvent,
  ParticipantJoinedEvent,
} from "@retro/contracts";
import type { RetroDesktopBridge } from "../../../shared/ipc-contracts";
import { useDesktopAudio } from "../../audio/useDesktopAudio";
import {
  acquireUserMedia,
  createRetroSimulatedVideoStream,
  createAudioLevelMeter,
} from "./mediaStreamHelper";
import { DesktopWebRtcCallEngine } from "./webrtcDesktopCallEngine";

export type CallState = "idle" | "calling" | "incoming" | "connected" | "ended";
export type CallType = "audio" | "video";

export interface UseDesktopCallReturn {
  callState: CallState;
  callType: CallType;
  conversationId: string | null;
  callerId: string | null;
  callerName: string;
  isMuted: boolean;
  isVideoOff: boolean;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  durationSeconds: number;
  durationFormatted: string;
  localAudioLevel: number;
  remoteAudioLevel: number;
  isSimulatedLocal: boolean;
  isSimulatedRemote: boolean;
  startCall: (
    conversationId: string,
    type?: CallType,
    targetName?: string,
  ) => Promise<void>;
  acceptCall: () => Promise<void>;
  declineCall: () => Promise<void>;
  leaveCall: () => Promise<void>;
  toggleMute: () => void;
  toggleVideo: () => void;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function useDesktopCall(
  bridge?: RetroDesktopBridge,
  currentUserId?: string,
): UseDesktopCallReturn {
  const [callState, setCallState] = useState<CallState>("idle");
  const [callType, setCallType] = useState<CallType>("audio");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [callerId, setCallerId] = useState<string | null>(null);
  const [callerName, setCallerName] = useState<string>("Đối phương");
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  // Streams & Metrics
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isSimulatedLocal, setIsSimulatedLocal] = useState(false);
  const [isSimulatedRemote, setIsSimulatedRemote] = useState(false);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [localAudioLevel, setLocalAudioLevel] = useState(0);
  const [remoteAudioLevel, setRemoteAudioLevel] = useState(0);

  // Cleanups refs
  const localCleanupRef = useRef<(() => void) | null>(null);
  const remoteCleanupRef = useRef<(() => void) | null>(null);
  const audioMeterCleanupsRef = useRef<(() => void)[]>([]);
  const durationTimerRef = useRef<number | null>(null);
  const callTimeoutTimerRef = useRef<number | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const rtcEngineRef = useRef<DesktopWebRtcCallEngine | null>(null);

  const {
    startOutgoingRingtone,
    startIncomingRingtone,
    stopRingtones,
    playCallConnected,
    playCallEnded,
  } = useDesktopAudio();

  const stopAllMedia = useCallback(() => {
    if (rtcEngineRef.current) {
      rtcEngineRef.current.destroy();
      rtcEngineRef.current = null;
    }
    if (durationTimerRef.current !== null) {
      window.clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
    if (callTimeoutTimerRef.current !== null) {
      window.clearTimeout(callTimeoutTimerRef.current);
      callTimeoutTimerRef.current = null;
    }
    audioMeterCleanupsRef.current.forEach((fn) => fn());
    audioMeterCleanupsRef.current = [];

    if (localCleanupRef.current) {
      localCleanupRef.current();
      localCleanupRef.current = null;
    }
    if (remoteCleanupRef.current) {
      remoteCleanupRef.current();
      remoteCleanupRef.current = null;
    }

    setLocalStream(null);
    setRemoteStream(null);
    localStreamRef.current = null;
    setDurationSeconds(0);
    setLocalAudioLevel(0);
    setRemoteAudioLevel(0);
    setIsSimulatedLocal(false);
    setIsSimulatedRemote(false);
  }, []);

  const handleCallEndedEvent = useCallback(
    (_event?: CallEndedEvent) => {
      stopRingtones();
      playCallEnded();
      stopAllMedia();
      setCallState("ended");
      setTimeout(() => {
        setCallState("idle");
        setConversationId(null);
        setCallerId(null);
      }, 1500);
    },
    [playCallEnded, stopAllMedia, stopRingtones],
  );

  const establishConnectedSession = useCallback(
    async (targetConversationId: string, isInitiator: boolean) => {
      if (!bridge) return;
      stopRingtones();
      playCallConnected();
      setCallState("connected");

      // Start duration clock
      setDurationSeconds(0);
      durationTimerRef.current = window.setInterval(() => {
        setDurationSeconds((sec) => sec + 1);
      }, 1000);

      // Start WebRTC Peer Connection
      const engine = new DesktopWebRtcCallEngine({
        conversationId: targetConversationId,
        isInitiator,
        callType,
        localStream: localStreamRef.current,
        bridge,
        onRemoteStream: (stream) => {
          setRemoteStream(stream);
          const meterCleanup = createAudioLevelMeter(stream, (lvl) => {
            setRemoteAudioLevel(lvl);
          });
          audioMeterCleanupsRef.current.push(meterCleanup);
        },
        onConnectionStateChange: (state) => {
          if (state === "failed" || state === "disconnected") {
            // In headless/unconnected VM environments, provide simulated remote video fallback
            if (!remoteCleanupRef.current) {
              const remoteSim = createRetroSimulatedVideoStream(
                callerName,
                "Remote Peer Connected",
              );
              setRemoteStream(remoteSim.stream);
              setIsSimulatedRemote(true);
              remoteCleanupRef.current = remoteSim.stop;
            }
          }
        },
      });

      rtcEngineRef.current = engine;
      await engine.start();

      // Grace period simulated remote stream for testing
      setTimeout(() => {
        setRemoteStream((curr) => {
          if (!curr && !remoteCleanupRef.current) {
            const remoteSim = createRetroSimulatedVideoStream(
              callerName,
              "Retro Webcam Active",
            );
            setIsSimulatedRemote(true);
            remoteCleanupRef.current = remoteSim.stop;
            return remoteSim.stream;
          }
          return curr;
        });
      }, 1200);
    },
    [
      bridge,
      callType,
      callerName,
      playCallConnected,
      stopRingtones,
    ],
  );

  // Listen to bridge realtime call events
  useEffect(() => {
    if (!bridge) return;

    const unsubStarted = bridge.onCallStarted((event: CallStartedEvent) => {
      if (currentUserId && event.callerId === currentUserId) {
        return;
      }
      setConversationId(event.conversationId);
      setCallerId(event.callerId);
      setCallerName(`Bạn bè (${event.callerId.slice(0, 6)})`);
      setCallType(event.callType === "video" ? "video" : "audio");
      setCallState("incoming");
      startIncomingRingtone();
    });

    const unsubEnded = bridge.onCallEnded((event: CallEndedEvent) => {
      handleCallEndedEvent(event);
    });

    const unsubJoined = bridge.onParticipantJoined(
      (event: ParticipantJoinedEvent) => {
        if (callState === "calling" && event.conversationId === conversationId) {
          if (callTimeoutTimerRef.current !== null) {
            window.clearTimeout(callTimeoutTimerRef.current);
            callTimeoutTimerRef.current = null;
          }
          void establishConnectedSession(event.conversationId, true);
        }
      },
    );

    const unsubLeft = bridge.onParticipantLeft(() => {
      // Participant left
    });

    return () => {
      unsubStarted();
      unsubEnded();
      unsubJoined();
      unsubLeft();
    };
  }, [
    bridge,
    callState,
    conversationId,
    currentUserId,
    establishConnectedSession,
    handleCallEndedEvent,
    startIncomingRingtone,
  ]);

  // Start outgoing call
  const startCall = useCallback(
    async (targetConversationId: string, type: CallType = "audio", targetName?: string) => {
      if (!bridge) return;
      stopAllMedia();
      setConversationId(targetConversationId);
      setCallType(type);
      setCallState("calling");
      setCallerName(targetName ?? "Đối phương");
      startOutgoingRingtone();

      // Acquire local media stream
      const localMedia = await acquireUserMedia({
        video: type === "video",
        audio: true,
        fallbackTitle: "Bạn (Webcam)",
      });
      setLocalStream(localMedia.stream);
      localStreamRef.current = localMedia.stream;
      setIsSimulatedLocal(localMedia.isSimulated);
      localCleanupRef.current = localMedia.stop;

      // Audio meter for local stream
      const meterCleanup = createAudioLevelMeter(localMedia.stream, (lvl) => {
        setLocalAudioLevel(lvl);
      });
      audioMeterCleanupsRef.current.push(meterCleanup);

      // Signal call start
      try {
        await bridge.startCall({
          conversationId: targetConversationId,
          callType: type,
        });
      } catch (err) {
        console.warn("Failed to signal startCall:", err);
      }

      // Auto-connect timeout for demo / standalone testing
      callTimeoutTimerRef.current = window.setTimeout(() => {
        void establishConnectedSession(targetConversationId, true);
      }, 5000);
    },
    [bridge, establishConnectedSession, startOutgoingRingtone, stopAllMedia],
  );

  // Accept incoming call
  const acceptCall = useCallback(async () => {
    if (!bridge || !conversationId) return;
    stopRingtones();

    const localMedia = await acquireUserMedia({
      video: callType === "video",
      audio: true,
      fallbackTitle: "Bạn (Webcam)",
    });
    setLocalStream(localMedia.stream);
    localStreamRef.current = localMedia.stream;
    setIsSimulatedLocal(localMedia.isSimulated);
    localCleanupRef.current = localMedia.stop;

    const meterCleanup = createAudioLevelMeter(localMedia.stream, (lvl) => {
      setLocalAudioLevel(lvl);
    });
    audioMeterCleanupsRef.current.push(meterCleanup);

    try {
      await bridge.joinCall({ conversationId });
    } catch (err) {
      console.warn("Failed to joinCall:", err);
    }

    void establishConnectedSession(conversationId, false);
  }, [bridge, callType, conversationId, establishConnectedSession, stopRingtones]);

  // Decline incoming call
  const declineCall = useCallback(async () => {
    stopRingtones();
    if (bridge && conversationId) {
      try {
        await bridge.endCall({ conversationId });
      } catch {
        // ignore
      }
    }
    stopAllMedia();
    setCallState("idle");
    setConversationId(null);
  }, [bridge, conversationId, stopAllMedia, stopRingtones]);

  // Leave active call
  const leaveCall = useCallback(async () => {
    stopRingtones();
    playCallEnded();
    if (bridge && conversationId) {
      try {
        await bridge.leaveCall({ conversationId });
      } catch {
        // ignore
      }
    }
    stopAllMedia();
    setCallState("ended");
    setTimeout(() => {
      setCallState("idle");
      setConversationId(null);
    }, 800);
  }, [bridge, conversationId, playCallEnded, stopAllMedia, stopRingtones]);

  // Toggle Mute
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach((t) => {
        t.enabled = !t.enabled;
      });
      setIsMuted((prev) => !prev);
    }
  }, []);

  // Toggle Video
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      videoTracks.forEach((t) => {
        t.enabled = !t.enabled;
      });
      setIsVideoOff((prev) => !prev);
    }
  }, []);

  return {
    callState,
    callType,
    conversationId,
    callerId,
    callerName,
    isMuted,
    isVideoOff,
    localStream,
    remoteStream,
    durationSeconds,
    durationFormatted: formatDuration(durationSeconds),
    localAudioLevel,
    remoteAudioLevel,
    isSimulatedLocal,
    isSimulatedRemote,
    startCall,
    acceptCall,
    declineCall,
    leaveCall,
    toggleMute,
    toggleVideo,
  };
}

