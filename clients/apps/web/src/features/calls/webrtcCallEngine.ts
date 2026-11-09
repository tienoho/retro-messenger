/**
 * Modern WebRTC P2P Call Engine
 * Standard W3C RTCPeerConnection with STUN ICE servers, SDP offer/answer negotiation,
 * track transceiver management, and automated fallback.
 */

import type { RetroRealtimeClient } from "@retro/realtime-client";

export interface WebRtcCallEngineOptions {
  conversationId: string;
  isInitiator: boolean;
  callType: "audio" | "video";
  localStream: MediaStream | null;
  realtime: RetroRealtimeClient;
  onRemoteStream: (stream: MediaStream) => void;
  onConnectionStateChange?: ((state: RTCPeerConnectionState) => void) | undefined;
}

const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
];

export class WebRtcCallEngine {
  private pc: RTCPeerConnection | null = null;
  private readonly conversationId: string;
  private readonly isInitiator: boolean;
  private readonly callType: "audio" | "video";
  private readonly localStream: MediaStream | null;
  private readonly realtime: RetroRealtimeClient;
  private readonly onRemoteStream: (stream: MediaStream) => void;
  private readonly onConnectionStateChange?: ((state: RTCPeerConnectionState) => void) | undefined;

  private unsubOffer: (() => void) | null = null;
  private unsubAnswer: (() => void) | null = null;
  private unsubIce: (() => void) | null = null;

  private pendingIceCandidates: RTCIceCandidateInit[] = [];
  private isDestroyed = false;

  constructor(options: WebRtcCallEngineOptions) {
    this.conversationId = options.conversationId;
    this.isInitiator = options.isInitiator;
    this.callType = options.callType;
    this.localStream = options.localStream;
    this.realtime = options.realtime;
    this.onRemoteStream = options.onRemoteStream;
    this.onConnectionStateChange = options.onConnectionStateChange;
  }

  public async start(): Promise<void> {
    if (typeof RTCPeerConnection === "undefined") {
      // Node or unsupported environment
      return;
    }

    try {
      this.pc = new RTCPeerConnection({
        iceServers: DEFAULT_ICE_SERVERS,
        iceCandidatePoolSize: 6,
      });

      // 1. Add local tracks to peer connection
      if (this.localStream) {
        this.localStream.getTracks().forEach((track) => {
          if (this.pc && this.localStream) {
            this.pc.addTrack(track, this.localStream);
          }
        });
      }

      // 2. Track remote stream when received
      this.pc.ontrack = (event) => {
        if (this.isDestroyed) return;
        if (event.streams && event.streams[0]) {
          this.onRemoteStream(event.streams[0]);
        } else {
          const inboundStream = new MediaStream();
          inboundStream.addTrack(event.track);
          this.onRemoteStream(inboundStream);
        }
      };

      // 3. ICE candidate handling
      this.pc.onicecandidate = (event) => {
        if (this.isDestroyed || !event.candidate) return;
        void this.realtime.sendIceCandidate(
          this.conversationId,
          event.candidate.candidate,
          event.candidate.sdpMid,
          event.candidate.sdpMLineIndex ?? undefined,
        );
      };

      this.pc.onconnectionstatechange = () => {
        if (!this.pc || this.isDestroyed) return;
        this.onConnectionStateChange?.(this.pc.connectionState);
      };

      // 4. Setup SignalR WebRTC listeners
      this.setupSignalRListeners();

      // 5. If initiator, create and send SDP offer
      if (this.isInitiator) {
        const offer = await this.pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: this.callType === "video",
        });
        await this.pc.setLocalDescription(offer);
        if (offer.sdp) {
          await this.realtime.sendCallOffer(this.conversationId, offer.sdp);
        }
      }
    } catch (err) {
      console.warn("WebRTC initialization notice:", err);
    }
  }

  private setupSignalRListeners(): void {
    // Handling Offer (Receiver side)
    this.unsubOffer = this.realtime.onCallOffer(async (evt) => {
      if (this.isDestroyed || !this.pc || this.conversationId !== evt.conversationId) return;
      if (this.isInitiator) return; // Initiator only receives answers

      try {
        await this.pc.setRemoteDescription(
          new RTCSessionDescription({ type: "offer", sdp: evt.sdp }),
        );

        // Drain any pending ICE candidates received before remote description
        await this.drainPendingIceCandidates();

        const answer = await this.pc.createAnswer();
        await this.pc.setLocalDescription(answer);

        if (answer.sdp) {
          await this.realtime.sendCallAnswer(this.conversationId, answer.sdp);
        }
      } catch (err) {
        console.warn("WebRTC error handling offer:", err);
      }
    });

    // Handling Answer (Caller side)
    this.unsubAnswer = this.realtime.onCallAnswer(async (evt) => {
      if (this.isDestroyed || !this.pc || this.conversationId !== evt.conversationId) return;

      try {
        if (this.pc.signalingState === "have-local-offer") {
          await this.pc.setRemoteDescription(
            new RTCSessionDescription({ type: "answer", sdp: evt.sdp }),
          );
          await this.drainPendingIceCandidates();
        }
      } catch (err) {
        console.warn("WebRTC error handling answer:", err);
      }
    });

    // Handling ICE Candidates from peer
    this.unsubIce = this.realtime.onIceCandidate(async (evt) => {
      if (this.isDestroyed || !this.pc || this.conversationId !== evt.conversationId) return;

      const candidateInit: RTCIceCandidateInit = {
        candidate: evt.candidate,
      };
      if (typeof evt.sdpMid === "string") {
        candidateInit.sdpMid = evt.sdpMid;
      }
      if (typeof evt.sdpMLineIndex === "number") {
        candidateInit.sdpMLineIndex = evt.sdpMLineIndex;
      }

      if (!this.pc.remoteDescription || !this.pc.remoteDescription.type) {
        this.pendingIceCandidates.push(candidateInit);
      } else {
        try {
          await this.pc.addIceCandidate(new RTCIceCandidate(candidateInit));
        } catch {
          // Ignore candidate pairing failure
        }
      }
    });
  }

  private async drainPendingIceCandidates(): Promise<void> {
    if (!this.pc) return;
    const candidates = [...this.pendingIceCandidates];
    this.pendingIceCandidates = [];
    for (const cand of candidates) {
      try {
        await this.pc.addIceCandidate(new RTCIceCandidate(cand));
      } catch {
        // ignore
      }
    }
  }

  public destroy(): void {
    this.isDestroyed = true;

    if (this.unsubOffer) {
      this.unsubOffer();
      this.unsubOffer = null;
    }
    if (this.unsubAnswer) {
      this.unsubAnswer();
      this.unsubAnswer = null;
    }
    if (this.unsubIce) {
      this.unsubIce();
      this.unsubIce = null;
    }

    if (this.pc) {
      this.pc.ontrack = null;
      this.pc.onicecandidate = null;
      this.pc.onconnectionstatechange = null;
      try {
        this.pc.close();
      } catch {
        // ignore
      }
      this.pc = null;
    }

    this.pendingIceCandidates = [];
  }
}

