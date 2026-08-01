import type { MessageDto } from "@retro/contracts";
import type { DesktopDatabase } from "./database/desktop-database.ts";
import {
  DesktopApiError,
  type DesktopSessionManager,
} from "./session-manager.ts";

export class DesktopOutboxProcessor {
  private readonly database: DesktopDatabase;
  private readonly session: DesktopSessionManager;
  private readonly onSent: (message: MessageDto) => void;
  private flushInProgress: Promise<void> | null = null;

  public constructor(
    database: DesktopDatabase,
    session: DesktopSessionManager,
    onSent: (message: MessageDto) => void,
  ) {
    this.database = database;
    this.session = session;
    this.onSent = onSent;
  }

  public flush(): Promise<void> {
    this.flushInProgress ??= this.flushCore().finally(() => {
      this.flushInProgress = null;
    });
    return this.flushInProgress;
  }

  private async flushCore(): Promise<void> {
    const accountId = this.session.getAccountId();
    if (!accountId) return;

    for (;;) {
      const entry = this.database.claimNext(accountId);
      if (!entry) return;

      try {
        const response = await this.session.sendMessage(
          entry.conversationId,
          entry.clientMessageId,
          entry.content,
        );
        this.database.acknowledgeWithMessage(accountId, response.message);
        this.onSent(response.message);
      } catch (error) {
        const permanent =
          error instanceof DesktopApiError &&
          error.status >= 400 &&
          error.status < 500 &&
          error.status !== 401 &&
          error.status !== 408 &&
          error.status !== 429;
        this.database.fail(entry.clientMessageId, permanent);
        if (!permanent) return;
      }
    }
  }
}
