import type {
  ConversationDto,
  MessageDto,
  PresenceChangedEvent,
} from "@retro/contracts";
import { RetroRealtimeClient } from "@retro/realtime-client";
import type {
  DesktopBuzzEvent,
  DesktopTypingEvent,
} from "../shared/ipc-contracts.ts";
import type { DesktopDatabase } from "./database/desktop-database.ts";
import type { DesktopSessionManager } from "./session-manager.ts";

export interface DesktopRealtimeCallbacks {
  onMessage(message: MessageDto): void;
  onTyping(event: DesktopTypingEvent): void;
  onBuzz(event: DesktopBuzzEvent): void;
  onPresence(event: PresenceChangedEvent): void;
  onUnreadChanged(count: number): void;
  isWindowFocused(): boolean;
}

export class DesktopRealtimeCoordinator {
  private readonly database: DesktopDatabase;
  private readonly session: DesktopSessionManager;
  private readonly client: RetroRealtimeClient;
  private readonly callbacks: DesktopRealtimeCallbacks;
  private started = false;
  private startInProgress: Promise<void> | null = null;
  private syncInProgress: Promise<void> | null = null;
  private activeConversationId: string | null = null;

  public constructor(
    apiBaseUrl: string,
    database: DesktopDatabase,
    session: DesktopSessionManager,
    callbacks: DesktopRealtimeCallbacks,
  ) {
    this.database = database;
    this.session = session;
    this.callbacks = callbacks;
    this.client = new RetroRealtimeClient(
      `${apiBaseUrl.replace(/\/$/, "")}/realtime`,
      async () => this.session.getAccessToken(),
    );

    this.client.onMessage((message) => this.receiveMessage(message));
    this.client.onTyping((conversationId, userId, isTyping) => {
      this.callbacks.onTyping({ conversationId, userId, isTyping });
    });
    this.client.onBuzz((conversationId, senderId, sentAt) => {
      this.callbacks.onBuzz({ conversationId, senderId, sentAt });
    });
    this.client.onPresence((event) => this.callbacks.onPresence(event));
    this.client.onReconnected(() => {
      void this.syncAll();
    });
  }

  public start(): Promise<void> {
    if (this.started || !this.session.getAccountId()) return Promise.resolve();
    this.startInProgress ??= this.startCore().finally(() => {
      this.startInProgress = null;
    });
    return this.startInProgress;
  }

  private async startCore(): Promise<void> {
    try {
      await this.client.start();
      this.started = true;
      await this.syncAll();
    } catch {
      this.started = false;
      // Offline startup remains usable from the account-scoped cache.
    }
  }

  public async stop(): Promise<void> {
    await this.startInProgress;
    this.started = false;
    await this.client.stop();
  }

  public async listConversations(): Promise<ConversationDto[]> {
    const accountId = this.requireAccountId();
    try {
      await this.syncAll();
    } catch {
      // The account-scoped SQLite cache is the intended offline fallback.
    }
    return this.database.listConversations(accountId);
  }

  public async listMessages(conversationId: string): Promise<MessageDto[]> {
    const accountId = this.requireAccountId();
    try {
      await this.syncConversation(accountId, conversationId);
    } catch {
      // Preserve cache-first behavior while disconnected.
    }
    this.database.markConversationRead(accountId, conversationId);
    this.callbacks.onUnreadChanged(this.database.getUnreadCount(accountId));
    return this.database.listMessages(accountId, conversationId);
  }

  public startTyping(conversationId: string): Promise<void> {
    return this.client.startTyping(conversationId);
  }

  public stopTyping(conversationId: string): Promise<void> {
    return this.client.stopTyping(conversationId);
  }

  public sendBuzz(conversationId: string): Promise<void> {
    return this.client.sendBuzz(conversationId);
  }

  public setActiveConversation(conversationId: string): void {
    this.activeConversationId = conversationId;
  }

  private syncAll(): Promise<void> {
    this.syncInProgress ??= this.syncAllCore().finally(() => {
      this.syncInProgress = null;
    });
    return this.syncInProgress;
  }

  private async syncAllCore(): Promise<void> {
    const accountId = this.requireAccountId();
    const conversations = await this.session.listConversations();
    this.database.upsertConversations(accountId, conversations);
    for (const conversation of conversations) {
      if (this.started) {
        await this.client.subscribeConversation(conversation.id);
      }
      await this.syncConversation(accountId, conversation.id);
    }
  }

  private async syncConversation(
    accountId: string,
    conversationId: string,
  ): Promise<void> {
    let afterSequence = this.database.getLastSequence(
      accountId,
      conversationId,
    );
    for (;;) {
      const messages = await this.session.listMessages(
        conversationId,
        afterSequence,
        100,
      );
      this.database.upsertMessages(accountId, messages);
      if (messages.length < 100) return;
      const nextSequence = Math.max(
        ...messages.map((message) => message.sequence),
      );
      if (nextSequence <= afterSequence) return;
      afterSequence = nextSequence;
    }
  }

  private receiveMessage(message: MessageDto): void {
    const accountId = this.session.getAccountId();
    if (!accountId) return;
    const inserted = this.database.upsertMessage(
      accountId,
      message,
      message.senderId !== accountId &&
        !(
          this.activeConversationId === message.conversationId &&
          this.callbacks.isWindowFocused()
        ),
    );
    if (!inserted) return;
    this.callbacks.onMessage(message);
    this.callbacks.onUnreadChanged(this.database.getUnreadCount(accountId));
  }

  private requireAccountId(): string {
    const accountId = this.session.getAccountId();
    if (!accountId) throw new Error("Authentication is required.");
    return accountId;
  }
}
