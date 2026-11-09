import {
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
  type HubConnection,
  type IHttpConnectionOptions,
} from "@microsoft/signalr";
import type {
  CallAnswerEvent,
  CallEndedEvent,
  CallOfferEvent,
  CallStartedEvent,
  IceCandidateEvent,
  MessageDto,
  ParticipantJoinedEvent,
  ParticipantLeftEvent,
  PresenceChangedEvent,
} from "@retro/contracts";

function eventRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;
}

function stringField(
  record: Record<string, unknown>,
  key: string,
  fallback = "",
): string {
  return typeof record[key] === "string" ? record[key] : fallback;
}

export class RetroRealtimeClient {
  private readonly connection: HubConnection;
  private readonly getAccessToken?: (() => Promise<string>) | undefined;
  private readonly subscribedConversations = new Set<string>();
  private readonly messageListeners = new Set<(message: MessageDto) => void>();
  private readonly reconnectedListeners = new Set<
    (connectionId?: string) => void
  >();

  public constructor(
    url: string,
    getAccessToken?: (() => Promise<string>) | undefined,
  ) {
    this.getAccessToken = getAccessToken;
    const connectionOptions: IHttpConnectionOptions = {};
    if (getAccessToken) {
      connectionOptions.accessTokenFactory = async () => {
        const token = await getAccessToken();
        return token ?? "";
      };
    }

    this.connection = new HubConnectionBuilder()
      .withUrl(url, connectionOptions)
      .withAutomaticReconnect([0, 2_000, 5_000, 10_000, 30_000])
      .configureLogging(LogLevel.Warning)
      .build();

    this.connection.on("MessageReceived", (message: MessageDto) => {
      for (const listener of this.messageListeners) {
        listener(message);
      }
    });

    this.connection.on(
      "MessageRead",
      (
        conversationId: string,
        readerId: string,
        sequence: number,
        readAt: string,
      ) => {
        for (const listener of this.messageReadListeners) {
          listener(conversationId, readerId, Number(sequence), readAt);
        }
      },
    );

    this.connection.onreconnected((connectionId) => {
      void this.resubscribeConversations();
      for (const listener of this.reconnectedListeners) {
        listener(connectionId ?? undefined);
      }
    });

    this.connection.on(
      "BuzzReceived",
      (conversationId: string, senderId: string, sentAt: string) => {
        for (const listener of this.buzzListeners) {
          listener(conversationId, senderId, sentAt);
        }
      },
    );

    this.connection.on(
      "TypingChanged",
      (conversationId: string, userId: string, isTyping: boolean) => {
        for (const listener of this.typingListeners) {
          listener(conversationId, userId, isTyping);
        }
      },
    );

    this.connection.on(
      "PresenceChanged",
      (
        userId: string,
        status: string,
        customStatus: string | null,
        occurredAt: string,
      ) => {
        const event: PresenceChangedEvent = {
          userId,
          status,
          customStatus,
          occurredAt,
        };
        for (const listener of this.presenceListeners) listener(event);
      },
    );

    this.connection.on(
      "CallStarted",
      (
        arg1: unknown,
        arg2?: string,
        arg3?: string,
        arg4?: "audio" | "video",
      ) => {
        const record = eventRecord(arg1);
        const event: CallStartedEvent = record
          ? {
              conversationId: stringField(record, "conversationId"),
              callerId: stringField(record, "callerId"),
              roomName: stringField(record, "roomName"),
              callType:
                stringField(record, "callType", "audio") === "video"
                  ? "video"
                  : "audio",
              startedAt: stringField(
                record,
                "startedAt",
                new Date().toISOString(),
              ),
            }
          : {
              conversationId: String(arg1),
              callerId: arg2 ?? "",
              roomName: arg3 ?? `conv_${arg1}`,
              callType: arg4 ?? "audio",
              startedAt: new Date().toISOString(),
            };
        for (const listener of this.callStartedListeners) {
          listener(event);
        }
      },
    );

    this.connection.on("CallEnded", (arg1: unknown, arg2?: string) => {
      const record = eventRecord(arg1);
      const event: CallEndedEvent = record
        ? {
            conversationId: stringField(record, "conversationId"),
            roomName: stringField(record, "roomName"),
            endedAt: stringField(record, "endedAt", new Date().toISOString()),
            ...(stringField(record, "endedById")
              ? { endedById: stringField(record, "endedById") }
              : {}),
            ...(stringField(record, "reason")
              ? { reason: stringField(record, "reason") }
              : {}),
          }
        : {
            conversationId: String(arg1),
            roomName: `conv_${arg1}`,
            endedAt: new Date().toISOString(),
            ...(arg2 ? { endedById: arg2 } : {}),
          };
      for (const listener of this.callEndedListeners) {
        listener(event);
      }
    });

    this.connection.on("ParticipantJoined", (arg1: unknown, arg2?: string) => {
      const record = eventRecord(arg1);
      const event: ParticipantJoinedEvent = record
        ? {
            conversationId: stringField(record, "conversationId"),
            userId: stringField(record, "userId"),
            roomName: stringField(record, "roomName"),
            joinedAt: stringField(record, "joinedAt", new Date().toISOString()),
          }
        : {
            conversationId: String(arg1),
            userId: arg2 ?? "",
            roomName: `conv_${arg1}`,
            joinedAt: new Date().toISOString(),
          };
      for (const listener of this.participantJoinedListeners) {
        listener(event);
      }
    });

    this.connection.on("ParticipantLeft", (arg1: unknown, arg2?: string) => {
      const record = eventRecord(arg1);
      const event: ParticipantLeftEvent = record
        ? {
            conversationId: stringField(record, "conversationId"),
            userId: stringField(record, "userId"),
            roomName: stringField(record, "roomName"),
            leftAt: stringField(record, "leftAt", new Date().toISOString()),
          }
        : {
            conversationId: String(arg1),
            userId: arg2 ?? "",
            roomName: `conv_${arg1}`,
            leftAt: new Date().toISOString(),
          };
      for (const listener of this.participantLeftListeners) {
        listener(event);
      }
    });

    this.connection.on(
      "CallOfferReceived",
      (arg1: unknown, arg2?: string, arg3?: string) => {
        const record = eventRecord(arg1);
        const event: CallOfferEvent = record
          ? {
              conversationId: stringField(record, "conversationId"),
              senderId: stringField(record, "senderId"),
              sdp: stringField(record, "sdp"),
            }
          : {
              conversationId: String(arg1),
              senderId: arg2 ?? "",
              sdp: arg3 ?? "",
            };
        for (const listener of this.callOfferListeners) {
          listener(event);
        }
      },
    );

    this.connection.on(
      "CallAnswerReceived",
      (arg1: unknown, arg2?: string, arg3?: string) => {
        const record = eventRecord(arg1);
        const event: CallAnswerEvent = record
          ? {
              conversationId: stringField(record, "conversationId"),
              senderId: stringField(record, "senderId"),
              sdp: stringField(record, "sdp"),
            }
          : {
              conversationId: String(arg1),
              senderId: arg2 ?? "",
              sdp: arg3 ?? "",
            };
        for (const listener of this.callAnswerListeners) {
          listener(event);
        }
      },
    );

    this.connection.on(
      "IceCandidateReceived",
      (
        arg1: unknown,
        arg2?: string,
        arg3?: string,
        arg4?: string,
        arg5?: number,
      ) => {
        const record = eventRecord(arg1);
        const event: IceCandidateEvent = record
          ? {
              conversationId: stringField(record, "conversationId"),
              senderId: stringField(record, "senderId"),
              candidate: stringField(record, "candidate"),
              sdpMid: stringField(record, "sdpMid") || null,
              sdpMLineIndex:
                typeof record["sdpMLineIndex"] === "number"
                  ? record["sdpMLineIndex"]
                  : null,
            }
          : {
              conversationId: String(arg1),
              senderId: arg2 ?? "",
              candidate: arg3 ?? "",
              sdpMid: arg4 ?? null,
              sdpMLineIndex: arg5 ?? null,
            };
        for (const listener of this.iceCandidateListeners) {
          listener(event);
        }
      },
    );
  }

  private readonly buzzListeners = new Set<
    (conversationId: string, senderId: string, sentAt: string) => void
  >();
  private readonly messageReadListeners = new Set<
    (
      conversationId: string,
      readerId: string,
      sequence: number,
      readAt: string,
    ) => void
  >();
  private readonly typingListeners = new Set<
    (conversationId: string, userId: string, isTyping: boolean) => void
  >();
  private readonly presenceListeners = new Set<
    (event: PresenceChangedEvent) => void
  >();
  private readonly callStartedListeners = new Set<
    (event: CallStartedEvent) => void
  >();
  private readonly callEndedListeners = new Set<
    (event: CallEndedEvent) => void
  >();
  private readonly participantJoinedListeners = new Set<
    (event: ParticipantJoinedEvent) => void
  >();
  private readonly participantLeftListeners = new Set<
    (event: ParticipantLeftEvent) => void
  >();
  private readonly callOfferListeners = new Set<
    (event: CallOfferEvent) => void
  >();
  private readonly callAnswerListeners = new Set<
    (event: CallAnswerEvent) => void
  >();
  private readonly iceCandidateListeners = new Set<
    (event: IceCandidateEvent) => void
  >();

  public async start(): Promise<void> {
    if (
      this.connection.state === HubConnectionState.Connected ||
      this.connection.state === HubConnectionState.Connecting
    ) {
      return;
    }

    if (this.getAccessToken) {
      const token = await this.getAccessToken();
      if (!token || !token.trim()) {
        return;
      }
    }

    try {
      await this.connection.start();
      await this.resubscribeConversations();
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes("stopped during negotiation")) {
        return;
      }
      throw error;
    }
  }

  public async stop(): Promise<void> {
    if (this.connection.state === HubConnectionState.Disconnected) {
      return;
    }
    try {
      await this.connection.stop();
    } catch {
      // Safe no-op if stop was interrupted
    }
  }

  public get isConnected(): boolean {
    return this.connection.state === HubConnectionState.Connected;
  }

  public async subscribeConversation(conversationId: string): Promise<void> {
    if (!conversationId) return;
    this.subscribedConversations.add(conversationId);
    if (this.connection.state === HubConnectionState.Connected) {
      try {
        await this.connection.invoke("SubscribeConversation", conversationId);
      } catch {
        // Safe failover, will resubscribe on reconnect
      }
    }
  }

  public unsubscribeConversation(conversationId: string): void {
    this.subscribedConversations.delete(conversationId);
  }

  private async resubscribeConversations(): Promise<void> {
    if (this.connection.state !== HubConnectionState.Connected) return;
    for (const conversationId of this.subscribedConversations) {
      try {
        await this.connection.invoke("SubscribeConversation", conversationId);
      } catch {
        // Ignore individual resubscription error
      }
    }
  }

  public async sendBuzz(conversationId: string): Promise<void> {
    if (
      this.connection.state !== HubConnectionState.Connected &&
      this.connection.state !== undefined
    ) {
      return;
    }
    return this.connection.invoke("SendBuzz", conversationId);
  }

  public async markRead(conversationId: string, sequence: number): Promise<void> {
    if (
      this.connection.state !== HubConnectionState.Connected &&
      this.connection.state !== undefined
    ) {
      return;
    }
    try {
      await this.connection.invoke("MarkRead", conversationId, sequence);
    } catch {
      // Ignore ephemeral markRead error
    }
  }

  public async startTyping(conversationId: string): Promise<void> {
    if (
      this.connection.state !== HubConnectionState.Connected &&
      this.connection.state !== undefined
    ) {
      return;
    }
    try {
      await this.connection.invoke("StartTyping", conversationId);
    } catch {
      // Ignore ephemeral typing error
    }
  }

  public async stopTyping(conversationId: string): Promise<void> {
    if (
      this.connection.state !== HubConnectionState.Connected &&
      this.connection.state !== undefined
    ) {
      return;
    }
    try {
      await this.connection.invoke("StopTyping", conversationId);
    } catch {
      // Ignore ephemeral typing error
    }
  }

  public startCall(
    conversationId: string,
    callType: string = "audio",
  ): Promise<void> {
    return this.connection.invoke("StartCall", conversationId, callType);
  }

  public endCall(conversationId: string): Promise<void> {
    return this.connection.invoke("EndCall", conversationId);
  }

  public joinCall(conversationId: string): Promise<void> {
    return this.connection.invoke("JoinCall", conversationId);
  }

  public leaveCall(conversationId: string): Promise<void> {
    return this.connection.invoke("LeaveCall", conversationId);
  }

  public sendCallOffer(conversationId: string, sdp: string): Promise<void> {
    return this.connection.invoke("SendCallOffer", conversationId, sdp);
  }

  public sendCallAnswer(conversationId: string, sdp: string): Promise<void> {
    return this.connection.invoke("SendCallAnswer", conversationId, sdp);
  }

  public sendIceCandidate(
    conversationId: string,
    candidate: string,
    sdpMid?: string | null,
    sdpMLineIndex?: number | null,
  ): Promise<void> {
    return this.connection.invoke(
      "SendIceCandidate",
      conversationId,
      candidate,
      sdpMid ?? null,
      sdpMLineIndex ?? null,
    );
  }

  public onMessage(listener: (message: MessageDto) => void): () => void {
    this.messageListeners.add(listener);
    return () => {
      this.messageListeners.delete(listener);
    };
  }

  public onMessageRead(
    listener: (
      conversationId: string,
      readerId: string,
      sequence: number,
      readAt: string,
    ) => void,
  ): () => void {
    this.messageReadListeners.add(listener);
    return () => {
      this.messageReadListeners.delete(listener);
    };
  }

  public onReconnected(listener: (connectionId?: string) => void): () => void {
    this.reconnectedListeners.add(listener);
    return () => {
      this.reconnectedListeners.delete(listener);
    };
  }

  public onBuzz(
    listener: (
      conversationId: string,
      senderId: string,
      sentAt: string,
    ) => void,
  ): () => void {
    this.buzzListeners.add(listener);
    return () => {
      this.buzzListeners.delete(listener);
    };
  }

  public onTyping(
    listener: (
      conversationId: string,
      userId: string,
      isTyping: boolean,
    ) => void,
  ): () => void {
    this.typingListeners.add(listener);
    return () => {
      this.typingListeners.delete(listener);
    };
  }

  public onPresence(
    listener: (event: PresenceChangedEvent) => void,
  ): () => void {
    this.presenceListeners.add(listener);
    return () => this.presenceListeners.delete(listener);
  }

  public onCallStarted(
    listener: (event: CallStartedEvent) => void,
  ): () => void {
    this.callStartedListeners.add(listener);
    return () => {
      this.callStartedListeners.delete(listener);
    };
  }

  public onCallEnded(listener: (event: CallEndedEvent) => void): () => void {
    this.callEndedListeners.add(listener);
    return () => {
      this.callEndedListeners.delete(listener);
    };
  }

  public onParticipantJoined(
    listener: (event: ParticipantJoinedEvent) => void,
  ): () => void {
    this.participantJoinedListeners.add(listener);
    return () => {
      this.participantJoinedListeners.delete(listener);
    };
  }

  public onParticipantLeft(
    listener: (event: ParticipantLeftEvent) => void,
  ): () => void {
    this.participantLeftListeners.add(listener);
    return () => {
      this.participantLeftListeners.delete(listener);
    };
  }

  public onCallOffer(
    listener: (event: CallOfferEvent) => void,
  ): () => void {
    this.callOfferListeners.add(listener);
    return () => {
      this.callOfferListeners.delete(listener);
    };
  }

  public onCallAnswer(
    listener: (event: CallAnswerEvent) => void,
  ): () => void {
    this.callAnswerListeners.add(listener);
    return () => {
      this.callAnswerListeners.delete(listener);
    };
  }

  public onIceCandidate(
    listener: (event: IceCandidateEvent) => void,
  ): () => void {
    this.iceCandidateListeners.add(listener);
    return () => {
      this.iceCandidateListeners.delete(listener);
    };
  }
}
