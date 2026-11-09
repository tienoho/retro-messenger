/**
 * Desktop WebRTC P2P Call Engine
 * Standard W3C RTCPeerConnection communicating via retroDesktop IPC bridge
 * for SDP offer/answer negotiation, ICE candidate exchange, and track transceivers.
 */

import type { RetroDesktopBridge } from "../../../shared/ipc-contracts";

export interface DesktopWebRtcCallEngineOptions {
  conversationId: string;
  isInitiator: boolean;
  callType: "audio" | "video";
  localStream: MediaStream | null;
  bridge: RetroDesktopBridge;
  onRemoteStream: (stream: MediaStream) => void;
  onConnectionStateChange?: ((state: RTCPeerConnectionState) => void) | undefined;
}

const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
];

export class DesktopWebRtcCallEngine {
  private pc: RTCPeerConnection | null = null;
  private readonly conversationId: string;
  private readonly isInitiator: boolean;
  private readonly callType: "audio" | "video";
  private readonly localStream: MediaStream | null;
  private readonly bridge: RetroDesktopBridge;
  private readonly onRemoteStream: (stream: MediaStream) => void;
  private readonly onConnectionStateChange?: ((state: RTCPeerConnectionState) => void) | undefined;

  private unsubOffer: (() => void) | null = null;
  private unsubAnswer: (() => void) | null = null;
  private unsubIce: (() => void) | null = null;

  private pendingIceCandidates: RTCIceCandidateInit[] = [];
  private isDestroyed = false;

  constructor(options: DesktopWebRtcCallEngineOptions) {
    this.conversationId = options.conversationId;
    this.isInitiator = options.isInitiator;
    this.callType = options.callType;
    this.localStream = options.localStream;
    this.bridge = options.bridge;
    this.onRemoteStream = options.onRemoteStream;
    this.onConnectionStateChange = options.onConnectionStateChange;
  }

  public async start(): Promise<void> {
    if (typeof RTCPeerConnection === "undefined") {
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
        const candidatePayload = {
          conversationId: this.conversationId,
          candidate: event.candidate.candidate,
          sdpMid: event.candidate.sdpMid,
          sdpMLineIndex: event.candidate.sdpMLineIndex,
        };
        void this.bridge.sendIceCandidate(candidatePayload);
      };

      this.pc.onconnectionstatechange = () => {
        if (!this.pc || this.isDestroyed) return;
        this.onConnectionStateChange?.(this.pc.connectionState);
      };

      // 4. Setup listeners for remote signaling
      this.setupSignalingListeners();

      // 5. If initiator, create offer
      if (this.isInitiator) {
        const offer = await this.pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: this.callType === "video",
        });
        await this.pc.setLocalDescription(offer);

        if (offer.sdp) {
          await this.bridge.sendCallOffer({
            conversationId: this.conversationId,
            sdp: offer.sdp,
          });
        }
      }
    } catch (err) {
      console.warn("Failed to start DesktopWebRtcCallEngine:", err);
    }
  }

  private setupSignalingListeners(): void {
    // Answer received (when initiator)
    this.unsubAnswer = this.bridge.onCallAnswerReceived(async (event) => {
      if (this.isDestroyed || !this.pc) return;
      if (event.conversationId !== this.conversationId) return;

      try {
        if (this.pc.signalingState === "have-local-offer") {
          await this.pc.setRemoteDescription(
            new RTCSessionDescription({
              type: "answer",
              sdp: event.sdp,
            }),
          );
          await this.drainPendingIceCandidates();
        }
      } catch (err) {
        console.warn("Failed to setRemoteDescription from answer:", err);
      }
    });

    // Offer received (when responder)
    this.unsubOffer = this.bridge.onCallOfferReceived(async (event) => {
      if (this.isDestroyed || !this.pc) return;
      if (event.conversationId !== this.conversationId) return;
      if (this.isInitiator) return; // Ignore if we are caller

      try {
        await this.pc.setRemoteDescription(
          new RTCSessionDescription({
            type: "offer",
            sdp: event.sdp,
          }),
        );
        await this.drainPendingIceCandidates();

        const answer = await this.pc.createAnswer();
        await this.pc.setLocalDescription(answer);

        if (answer.sdp) {
          await this.bridge.sendCallAnswer({
            conversationId: this.conversationId,
            sdp: answer.sdp,
          });
        }
      } catch (err) {
        console.warn("Failed to handle offer:", err);
      }
    });

    // Remote ICE candidate received
    this.unsubIce = this.bridge.onIceCandidateReceived(async (event) => {
      if (this.isDestroyed || !this.pc) return;
      if (event.conversationId !== this.conversationId) return;

      const candidateInit: RTCIceCandidateInit = {
        candidate: event.candidate,
        ...(event.sdpMid ? { sdpMid: event.sdpMid } : {}),
        ...(typeof event.sdpMLineIndex === "number"
          ? { sdpMLineIndex: event.sdpMLineIndex }
          : {}),
      };

      if (this.pc.remoteDescription && this.pc.remoteDescription.type) {
        try {
          await this.pc.addIceCandidate(new RTCIceCandidate(candidateInit));
        } catch (err) {
          console.warn("Failed to add remote ICE candidate:", err);
        }
      } else {
        this.pendingIceCandidates.push(candidateInit);
      }
    });
  }

  private async drainPendingIceCandidates(): Promise<void> {
    if (!this.pc) return;
    const candidates = [...this.pendingIceCandidates];
    this.pendingIceCandidates = [];
    for (const c of candidates) {
      try {
        await this.pc.addIceCandidate(new RTCIceCandidate(c));
      } catch (err) {
        console.warn("Failed to drain candidate:", err);
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
      this.pc.close();
      this.pc = null;
    }
    this.pendingIceCandidates = [];
  }
}

