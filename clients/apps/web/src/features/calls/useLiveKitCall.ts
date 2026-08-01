import { useState, useEffect, useCallback } from "react";
import type { RetroApiClient } from "@retro/api-client";
import type { RetroRealtimeClient } from "@retro/realtime-client";
import type {
  CallEndedEvent,
  CallStartedEvent,
  ParticipantJoinedEvent,
} from "@retro/contracts";

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
  token: string | null;
  liveKitUrl: string | null;
  startCall: (conversationId: string, type?: CallType) => Promise<void>;
  acceptCall: () => Promise<void>;
  declineCall: () => Promise<void>;
  leaveCall: () => Promise<void>;
  toggleMute: () => void;
  toggleVideo: () => void;
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

  useEffect(() => {
    const unsubStarted = realtime.onCallStarted((evt: CallStartedEvent) => {
      if (evt.callerId !== currentUserId) {
        setCallState("incoming");
        setConversationId(evt.conversationId);
        setRoomName(evt.roomName);
        setCallType(evt.callType ?? "audio");
        setCallerId(evt.callerId);
        setCallerName(evt.callerId ? `User ${evt.callerId.slice(0, 5)}` : "Đối phương");
      }
    });

    const unsubEnded = realtime.onCallEnded((_evt: CallEndedEvent) => {
      setCallState("ended");
      setTimeout(() => {
        setCallState("idle");
        setConversationId(null);
        setToken(null);
      }, 1500);
    });

    const unsubJoined = realtime.onParticipantJoined((_evt: ParticipantJoinedEvent) => {
      if (callState === "calling" || callState === "incoming") {
        setCallState("connected");
      }
    });

    return () => {
      unsubStarted();
      unsubEnded();
      unsubJoined();
    };
  }, [realtime, currentUserId, callState]);

  const startCall = useCallback(
    async (targetConvId: string, type: CallType = "audio") => {
      const generatedRoom = `room-${targetConvId}-${Date.now()}`;
      setConversationId(targetConvId);
      setRoomName(generatedRoom);
      setCallType(type);
      setCallState("calling");
      setCallerId(currentUserId ?? null);

      try {
        const tokenRes = await api.getCallToken(targetConvId, generatedRoom, "publisher");
        setToken(tokenRes.token);
        setLiveKitUrl(tokenRes.liveKitUrl);
        await realtime.startCall(targetConvId, type);
      } catch (err) {
        console.error("Failed to start call:", err);
        // Fallback for offline/test mode
        setToken("mock-jwt-token");
        setLiveKitUrl("ws://localhost:7880");
        void realtime.startCall(targetConvId, type).catch(() => {});
      }
    },
    [api, realtime, currentUserId],
  );

  const acceptCall = useCallback(async () => {
    if (!conversationId) return;
    try {
      const tokenRes = await api.getCallToken(conversationId, roomName, "subscriber");
      setToken(tokenRes.token);
      setLiveKitUrl(tokenRes.liveKitUrl);
      await realtime.joinCall(conversationId);
    } catch (err) {
      console.error("Failed to accept call token:", err);
      setToken("mock-jwt-token");
      setLiveKitUrl("ws://localhost:7880");
      void realtime.joinCall(conversationId).catch(() => {});
    }
    setCallState("connected");
  }, [api, realtime, conversationId, roomName]);

  const declineCall = useCallback(async () => {
    if (conversationId) {
      try {
        await realtime.endCall(conversationId);
      } catch {
        // Ignore
      }
    }
    setCallState("idle");
    setConversationId(null);
  }, [realtime, conversationId]);

  const leaveCall = useCallback(async () => {
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
  }, [realtime, conversationId]);

  const toggleMute = useCallback(() => setIsMuted(prev => !prev), []);
  const toggleVideo = useCallback(() => setIsVideoOff(prev => !prev), []);

  return {
    callState,
    callType,
    conversationId,
    roomName,
    callerId,
    callerName,
    isMuted,
    isVideoOff,
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
