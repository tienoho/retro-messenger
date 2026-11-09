import { useState, useEffect, useCallback, useRef } from "react";
import type { RetroApiClient } from "@retro/api-client";
import type { RetroRealtimeClient } from "@retro/realtime-client";
import type {
  CallEndedEvent,
  CallStartedEvent,
  ParticipantJoinedEvent,
} from "@retro/contracts";
import { useRetroAudio } from "../../audio/useRetroAudio";
import {
  acquireUserMedia,
  createRetroSimulatedVideoStream,
  createAudioLevelMeter,
} from "./mediaStreamHelper";

export type CallState = "idle" | "calling" | "incoming" | "connected" | "ended";
export type CallType = "audio" | "video";

export interface UseLiveKitCallReturn {
  callState: CallState;
  callType: CallType;
  conversationId: string | null;
  roomName: string;
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
  token: string | null;
  liveKitUrl: string | null;
  startCall: (conversationId: string, type?: CallType) => Promise<void>;
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

export function useLiveKitCall(
  api: RetroApiClient,
  realtime: RetroRealtimeClient,
  currentUserId?: string,
): UseLiveKitCallReturn {
  const [callState, setCallState] = useState<CallState>("idle");
  const [callType, setCallType] = useState<CallType>("audio");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [roomName, setRoomName] = useState<string>("");
  const [callerId, setCallerId] = useState<string | null>(null);
  const [callerName, setCallerName] = useState<string>("Đối phương");
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [liveKitUrl, setLiveKitUrl] = useState<string | null>(null);

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

  const {
    startOutgoingRingtone,
    startIncomingRingtone,
    stopRingtones,
    playCallConnected,
    playCallEnded,
  } = useRetroAudio();

  const stopAllMedia = useCallback(() => {
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

    localStreamRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    setDurationSeconds(0);
    setLocalAudioLevel(0);
    setRemoteAudioLevel(0);
  }, []);

  const setupMediaStreams = useCallback(
    async (type: CallType, partnerName: string) => {
      stopAllMedia();

      // 1. Acquire Local Media
      const local = await acquireUserMedia({
        audio: true,
        video: type === "video",
        fallbackTitle: "Webcam của bạn",
        fallbackSubtitle: "Yahoo! Super Video",
      });

      localCleanupRef.current = local.stop;
      localStreamRef.current = local.stream;
      setLocalStream(local.stream);
      setIsSimulatedLocal(local.isSimulated);

      // 2. Setup Remote Stream (simulated or peer feed)
      if (type === "video") {
        const remoteVideo = createRetroSimulatedVideoStream(
          `Webcam: ${partnerName}`,
          "Yahoo! Video Chat Live Feed",
        );
        remoteCleanupRef.current = remoteVideo.stop;
        setRemoteStream(remoteVideo.stream);
        setIsSimulatedRemote(true);
      }

      // 3. Setup Audio Level Meter
      const cleanMeter = createAudioLevelMeter(local.stream, (lvl) => {
        setLocalAudioLevel(lvl);
        // Simulate partner audio responsiveness
        setRemoteAudioLevel(Math.max(0, lvl + Math.floor(Math.sin(Date.now() / 300) * 15)));
      });
      audioMeterCleanupsRef.current.push(cleanMeter);

      // 4. Start Duration Timer
      setDurationSeconds(0);
      durationTimerRef.current = window.setInterval(() => {
        setDurationSeconds((sec) => sec + 1);
      }, 1000);
    },
    [stopAllMedia],
  );

  // Realtime SignalR Listeners
  useEffect(() => {
    const unsubStarted = realtime.onCallStarted((evt: CallStartedEvent) => {
      if (evt.callerId !== currentUserId) {
        setCallState("incoming");
        setConversationId(evt.conversationId);
        setRoomName(evt.roomName);
        setCallType(evt.callType ?? "audio");
        setCallerId(evt.callerId);
        const name = evt.callerId ? `User ${evt.callerId.slice(0, 5)}` : "Đối phương";
        setCallerName(name);

        // Play incoming ringtone
        startIncomingRingtone();

        // 45s incoming call timeout
        if (callTimeoutTimerRef.current !== null) {
          window.clearTimeout(callTimeoutTimerRef.current);
        }
        callTimeoutTimerRef.current = window.setTimeout(() => {
          stopRingtones();
          setCallState("idle");
          setConversationId(null);
        }, 45000);
      }
    });

    const unsubEnded = realtime.onCallEnded((_evt: CallEndedEvent) => {
      stopRingtones();
      playCallEnded();
      stopAllMedia();
      setCallState("ended");
      setTimeout(() => {
        setCallState("idle");
        setConversationId(null);
        setToken(null);
      }, 1800);
    });

    const unsubJoined = realtime.onParticipantJoined((_evt: ParticipantJoinedEvent) => {
      if (callState === "calling" || callState === "incoming") {
        stopRingtones();
        playCallConnected();
        setCallState("connected");
        void setupMediaStreams(callType, callerName);
      }
    });

    return () => {
      unsubStarted();
      unsubEnded();
      unsubJoined();
    };
  }, [
    realtime,
    currentUserId,
    callState,
    callType,
    callerName,
    startIncomingRingtone,
    stopRingtones,
    playCallConnected,
    playCallEnded,
    stopAllMedia,
    setupMediaStreams,
  ]);

  const startCall = useCallback(
    async (targetConvId: string, type: CallType = "audio") => {
      const generatedRoom = `room-${targetConvId}-${Date.now()}`;
      setConversationId(targetConvId);
      setRoomName(generatedRoom);
      setCallType(type);
      setCallState("calling");
      setCallerId(currentUserId ?? null);
      startOutgoingRingtone();

      // 40s calling timeout if nobody answers
      if (callTimeoutTimerRef.current !== null) {
        window.clearTimeout(callTimeoutTimerRef.current);
      }
      callTimeoutTimerRef.current = window.setTimeout(() => {
        stopRingtones();
        playCallEnded();
        setCallState("ended");
        setTimeout(() => {
          setCallState("idle");
          setConversationId(null);
        }, 1800);
      }, 40000);

      try {
        const tokenRes = await api.getCallToken(targetConvId, generatedRoom, "publisher");
        setToken(tokenRes.token);
        setLiveKitUrl(tokenRes.liveKitUrl);
        await realtime.startCall(targetConvId, type);
      } catch (err) {
        // Fallback for offline/test mode
        setToken("mock-jwt-token");
        setLiveKitUrl("ws://localhost:7880");
        void realtime.startCall(targetConvId, type).catch(() => {});
      }
    },
    [api, realtime, currentUserId, startOutgoingRingtone, stopRingtones, playCallEnded],
  );

  const acceptCall = useCallback(async () => {
    if (!conversationId) return;
    stopRingtones();
    playCallConnected();

    try {
      const tokenRes = await api.getCallToken(conversationId, roomName, "subscriber");
      setToken(tokenRes.token);
      setLiveKitUrl(tokenRes.liveKitUrl);
      await realtime.joinCall(conversationId);
    } catch {
      setToken("mock-jwt-token");
      setLiveKitUrl("ws://localhost:7880");
      void realtime.joinCall(conversationId).catch(() => {});
    }

    setCallState("connected");
    void setupMediaStreams(callType, callerName);
  }, [api, realtime, conversationId, roomName, callType, callerName, stopRingtones, playCallConnected, setupMediaStreams]);

  const declineCall = useCallback(async () => {
    stopRingtones();
    playCallEnded();
    stopAllMedia();

    if (conversationId) {
      try {
        await realtime.endCall(conversationId);
      } catch {
        // Ignore
      }
    }
    setCallState("idle");
    setConversationId(null);
  }, [realtime, conversationId, stopRingtones, playCallEnded, stopAllMedia]);

  const leaveCall = useCallback(async () => {
    stopRingtones();
    playCallEnded();
    stopAllMedia();

    if (conversationId) {
      try {
        await realtime.endCall(conversationId);
      } catch {
        // Ignore
      }
    }
    setCallState("ended");
    setTimeout(() => {
      setCallState("idle");
      setConversationId(null);
    }, 1500);
  }, [realtime, conversationId, stopRingtones, playCallEnded, stopAllMedia]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach((track) => {
          track.enabled = !next;
        });
      }
      return next;
    });
  }, []);

  const toggleVideo = useCallback(() => {
    setIsVideoOff((prev) => {
      const next = !prev;
      if (localStreamRef.current) {
        localStreamRef.current.getVideoTracks().forEach((track) => {
          track.enabled = !next;
        });
      }
      return next;
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRingtones();
      stopAllMedia();
    };
  }, [stopRingtones, stopAllMedia]);

  return {
    callState,
    callType,
    conversationId,
    roomName,
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
    token,
    liveKitUrl,
    startCall,
    acceptCall,
    declineCall,
    leaveCall,
    toggleMute,
    toggleVideo,
  };
}
