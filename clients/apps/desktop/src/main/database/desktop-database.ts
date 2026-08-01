import { DatabaseSync } from "node:sqlite";
import type { ConversationDto, MessageDto } from "@retro/contracts";
import type {
  DesktopOutboxEntry,
  DesktopOutboxState,
} from "../../shared/ipc-contracts.ts";

export interface StoredDesktopSession {
  encryptedRefreshToken: Uint8Array;
  userId: string;
  username: string;
  displayName: string;
  status: string;
}

interface SessionRow {
  encrypted_refresh_token: Uint8Array;
  user_id: string;
  username: string;
  display_name: string;
  status: string;
}

interface OutboxRow {
  account_id: string;
  client_message_id: string;
  conversation_id: string;
  content: string;
  state: DesktopOutboxState;
  attempt_count: number;
  next_attempt_at: number | null;
  created_at: number;
  updated_at: number;
}

interface ConversationRow {
  conversation_id: string;
  title: string;
  last_sequence: number;
  member_ids_json: string;
}

interface MessageRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  client_message_id: string;
  sequence: number;
  type: string;
  content: string;
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
}

const migrationV1 = `
  CREATE TABLE IF NOT EXISTS desktop_session (
    singleton_id INTEGER PRIMARY KEY CHECK (singleton_id = 1),
    encrypted_refresh_token BLOB NOT NULL,
    user_id TEXT NOT NULL,
    username TEXT NOT NULL,
    display_name TEXT NOT NULL,
    status TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  ) STRICT;

  CREATE TABLE IF NOT EXISTS desktop_outbox (
    client_message_id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL,
    conversation_id TEXT NOT NULL,
    content TEXT NOT NULL,
    state TEXT NOT NULL CHECK (
      state IN ('pending', 'sending', 'failed-retryable', 'failed-permanent')
    ),
    attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
    next_attempt_at INTEGER,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  ) STRICT;

  CREATE INDEX IF NOT EXISTS ix_desktop_outbox_due
    ON desktop_outbox (account_id, next_attempt_at, created_at)
    WHERE state IN ('pending', 'failed-retryable');

  PRAGMA user_version = 1;
`;

const migrationV2 = `
  CREATE TABLE IF NOT EXISTS desktop_conversations (
    account_id TEXT NOT NULL,
    conversation_id TEXT NOT NULL,
    title TEXT NOT NULL,
    last_sequence INTEGER NOT NULL DEFAULT 0 CHECK (last_sequence >= 0),
    member_ids_json TEXT NOT NULL,
    unread_count INTEGER NOT NULL DEFAULT 0 CHECK (unread_count >= 0),
    updated_at INTEGER NOT NULL,
    PRIMARY KEY (account_id, conversation_id)
  ) STRICT;

  CREATE TABLE IF NOT EXISTS desktop_messages (
    account_id TEXT NOT NULL,
    id TEXT NOT NULL,
    conversation_id TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    client_message_id TEXT NOT NULL,
    sequence INTEGER NOT NULL CHECK (sequence >= 0),
    type TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL,
    edited_at TEXT,
    deleted_at TEXT,
    PRIMARY KEY (account_id, id),
    UNIQUE (account_id, conversation_id, sequence),
    UNIQUE (account_id, client_message_id),
    FOREIGN KEY (account_id, conversation_id)
      REFERENCES desktop_conversations (account_id, conversation_id)
      ON DELETE CASCADE
  ) STRICT;

  CREATE INDEX IF NOT EXISTS ix_desktop_messages_history
    ON desktop_messages (account_id, conversation_id, sequence);

  CREATE TABLE IF NOT EXISTS desktop_attachment_cache (
    account_id TEXT NOT NULL,
    attachment_id TEXT NOT NULL,
    conversation_id TEXT NOT NULL,
    file_name TEXT NOT NULL,
    content_type TEXT NOT NULL,
    file_size_bytes INTEGER NOT NULL CHECK (file_size_bytes >= 0),
    status TEXT NOT NULL,
    updated_at INTEGER NOT NULL,
    PRIMARY KEY (account_id, attachment_id)
  ) STRICT;

  PRAGMA user_version = 2;
`;

function mapOutbox(row: OutboxRow): DesktopOutboxEntry {
  return {
    accountId: row.account_id,
    clientMessageId: row.client_message_id,
    conversationId: row.conversation_id,
    content: row.content,
    state: row.state,
    attemptCount: row.attempt_count,
    nextAttemptAt:
      row.next_attempt_at === null
        ? null
        : new Date(row.next_attempt_at).toISOString(),
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

function mapConversation(row: ConversationRow): ConversationDto {
  return {
    id: row.conversation_id,
    title: row.title,
    lastSequence: row.last_sequence,
    memberIds: JSON.parse(row.member_ids_json) as string[],
  };
}

function mapMessage(row: MessageRow): MessageDto {
  const numericType = Number(row.type);
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    clientMessageId: row.client_message_id,
    sequence: row.sequence,
    type: Number.isNaN(numericType)
      ? (row.type as MessageDto["type"])
      : numericType,
    content: row.content,
    createdAt: row.created_at,
    editedAt: row.edited_at,
    deletedAt: row.deleted_at,
  };
}

export class DesktopDatabase {
  private readonly database: DatabaseSync;

  public constructor(path: string) {
    this.database = new DatabaseSync(path);
    this.database.exec("PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;");
    if (path !== ":memory:") {
      this.database.exec(
        "PRAGMA journal_mode = WAL; PRAGMA synchronous = NORMAL;",
      );
    }
    this.runMigrations();
    this.recoverInterruptedSends();
  }

  public close(): void {
    this.database.close();
  }

  public getSchemaVersion(): number {
    const row = this.database.prepare("PRAGMA user_version").get() as {
      user_version: number;
    };
    return row.user_version;
  }

  public saveSession(session: StoredDesktopSession, now = Date.now()): void {
    this.database
      .prepare(
        `
      INSERT INTO desktop_session (
        singleton_id, encrypted_refresh_token, user_id, username,
        display_name, status, updated_at
      ) VALUES (1, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(singleton_id) DO UPDATE SET
        encrypted_refresh_token = excluded.encrypted_refresh_token,
        user_id = excluded.user_id,
        username = excluded.username,
        display_name = excluded.display_name,
        status = excluded.status,
        updated_at = excluded.updated_at
    `,
      )
      .run(
        session.encryptedRefreshToken,
        session.userId,
        session.username,
        session.displayName,
        session.status,
        now,
      );
  }

  public loadSession(): StoredDesktopSession | null {
    const row = this.database
      .prepare(
        `
      SELECT encrypted_refresh_token, user_id, username, display_name, status
      FROM desktop_session
      WHERE singleton_id = 1
    `,
      )
      .get() as SessionRow | undefined;

    return row
      ? {
          encryptedRefreshToken: row.encrypted_refresh_token,
          userId: row.user_id,
          username: row.username,
          displayName: row.display_name,
          status: row.status,
        }
      : null;
  }

  public clearSession(): void {
    this.database
      .prepare("DELETE FROM desktop_session WHERE singleton_id = 1")
      .run();
  }

  public upsertConversations(
    accountId: string,
    conversations: ConversationDto[],
    now = Date.now(),
  ): void {
    const statement = this.database.prepare(`
      INSERT INTO desktop_conversations (
        account_id, conversation_id, title, last_sequence,
        member_ids_json, unread_count, updated_at
      ) VALUES (?, ?, ?, ?, ?, 0, ?)
      ON CONFLICT(account_id, conversation_id) DO UPDATE SET
        title = excluded.title,
        last_sequence = MAX(desktop_conversations.last_sequence, excluded.last_sequence),
        member_ids_json = excluded.member_ids_json,
        updated_at = excluded.updated_at
    `);
    this.database.exec("BEGIN IMMEDIATE");
    try {
      for (const conversation of conversations) {
        statement.run(
          accountId,
          conversation.id,
          conversation.title,
          conversation.lastSequence,
          JSON.stringify(conversation.memberIds),
          now,
        );
      }
      this.database.exec("COMMIT");
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }
  }

  public listConversations(accountId: string): ConversationDto[] {
    const rows = this.database
      .prepare(
        `
      SELECT conversation_id, title, last_sequence, member_ids_json
      FROM desktop_conversations
      WHERE account_id = ?
      ORDER BY updated_at DESC, title
    `,
      )
      .all(accountId) as unknown as ConversationRow[];
    return rows.map(mapConversation);
  }

  public upsertMessage(
    accountId: string,
    message: MessageDto,
    incrementUnread = false,
    now = Date.now(),
  ): boolean {
    this.ensureConversationPlaceholder(accountId, message.conversationId, now);
    const existed =
      this.database
        .prepare(
          `
      SELECT 1 FROM desktop_messages WHERE account_id = ? AND id = ?
    `,
        )
        .get(accountId, message.id) !== undefined;
    this.database.exec("BEGIN IMMEDIATE");
    try {
      this.database
        .prepare(
          `
        INSERT INTO desktop_messages (
          account_id, id, conversation_id, sender_id, client_message_id,
          sequence, type, content, created_at, edited_at, deleted_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(account_id, id) DO UPDATE SET
          content = excluded.content,
          type = excluded.type,
          edited_at = excluded.edited_at,
          deleted_at = excluded.deleted_at
      `,
        )
        .run(
          accountId,
          message.id,
          message.conversationId,
          message.senderId,
          message.clientMessageId,
          message.sequence,
          String(message.type),
          message.content,
          message.createdAt,
          message.editedAt ?? null,
          message.deletedAt ?? null,
        );
      const inserted = !existed;
      this.database
        .prepare(
          `
        UPDATE desktop_conversations
        SET last_sequence = MAX(last_sequence, ?),
            unread_count = unread_count + ?,
            updated_at = ?
        WHERE account_id = ? AND conversation_id = ?
      `,
        )
        .run(
          message.sequence,
          inserted && incrementUnread ? 1 : 0,
          now,
          accountId,
          message.conversationId,
        );
      this.database.exec("COMMIT");
      return inserted;
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }
  }

  public upsertMessages(accountId: string, messages: MessageDto[]): void {
    for (const message of messages) this.upsertMessage(accountId, message);
  }

  public listMessages(accountId: string, conversationId: string): MessageDto[] {
    const rows = this.database
      .prepare(
        `
      SELECT id, conversation_id, sender_id, client_message_id, sequence,
             type, content, created_at, edited_at, deleted_at
      FROM desktop_messages
      WHERE account_id = ? AND conversation_id = ?
      ORDER BY sequence
    `,
      )
      .all(accountId, conversationId) as unknown as MessageRow[];
    return rows.map(mapMessage);
  }

  public getLastSequence(accountId: string, conversationId: string): number {
    const row = this.database
      .prepare(
        `
      SELECT COALESCE(MAX(sequence), 0) AS last_sequence
      FROM desktop_messages
      WHERE account_id = ? AND conversation_id = ?
    `,
      )
      .get(accountId, conversationId) as { last_sequence: number };
    return row.last_sequence;
  }

  public markConversationRead(accountId: string, conversationId: string): void {
    this.database
      .prepare(
        `
      UPDATE desktop_conversations SET unread_count = 0
      WHERE account_id = ? AND conversation_id = ?
    `,
      )
      .run(accountId, conversationId);
  }

  public getUnreadCount(accountId: string): number {
    const row = this.database
      .prepare(
        `
      SELECT COALESCE(SUM(unread_count), 0) AS unread_count
      FROM desktop_conversations WHERE account_id = ?
    `,
      )
      .get(accountId) as { unread_count: number };
    return row.unread_count;
  }

  public acknowledgeWithMessage(accountId: string, message: MessageDto): void {
    const now = Date.now();
    this.ensureConversationPlaceholder(accountId, message.conversationId, now);
    this.database.exec("BEGIN IMMEDIATE");
    try {
      this.database
        .prepare(
          `
        INSERT INTO desktop_messages (
          account_id, id, conversation_id, sender_id, client_message_id,
          sequence, type, content, created_at, edited_at, deleted_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(account_id, id) DO UPDATE SET
          content = excluded.content,
          type = excluded.type,
          edited_at = excluded.edited_at,
          deleted_at = excluded.deleted_at
      `,
        )
        .run(
          accountId,
          message.id,
          message.conversationId,
          message.senderId,
          message.clientMessageId,
          message.sequence,
          String(message.type),
          message.content,
          message.createdAt,
          message.editedAt ?? null,
          message.deletedAt ?? null,
        );
      this.database
        .prepare(
          `
        UPDATE desktop_conversations
        SET last_sequence = MAX(last_sequence, ?), updated_at = ?
        WHERE account_id = ? AND conversation_id = ?
      `,
        )
        .run(message.sequence, now, accountId, message.conversationId);
      this.database
        .prepare(
          "DELETE FROM desktop_outbox WHERE account_id = ? AND client_message_id = ?",
        )
        .run(accountId, message.clientMessageId);
      this.database.exec("COMMIT");
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }
  }

  public clearAccountData(accountId: string): void {
    this.database.exec("BEGIN IMMEDIATE");
    try {
      this.database
        .prepare("DELETE FROM desktop_outbox WHERE account_id = ?")
        .run(accountId);
      this.database
        .prepare("DELETE FROM desktop_attachment_cache WHERE account_id = ?")
        .run(accountId);
      this.database
        .prepare("DELETE FROM desktop_conversations WHERE account_id = ?")
        .run(accountId);
      this.database.exec("COMMIT");
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }
  }

  public cacheAttachment(
    accountId: string,
    attachmentId: string,
    conversationId: string,
    fileName: string,
    contentType: string,
    fileSizeBytes: number,
    status: string,
    now = Date.now(),
  ): void {
    this.database
      .prepare(
        `
      INSERT INTO desktop_attachment_cache (
        account_id, attachment_id, conversation_id, file_name,
        content_type, file_size_bytes, status, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(account_id, attachment_id) DO UPDATE SET
        status = excluded.status,
        updated_at = excluded.updated_at
    `,
      )
      .run(
        accountId,
        attachmentId,
        conversationId,
        fileName,
        contentType,
        fileSizeBytes,
        status,
        now,
      );
  }

  public enqueue(
    accountId: string,
    conversationId: string,
    clientMessageId: string,
    content: string,
    now = Date.now(),
  ): DesktopOutboxEntry {
    const existing = this.getOutboxById(clientMessageId);
    if (existing) {
      if (
        existing.accountId !== accountId ||
        existing.conversationId !== conversationId ||
        existing.content !== content
      ) {
        throw new Error(
          "clientMessageId is already bound to different content.",
        );
      }
      return existing;
    }

    this.database
      .prepare(
        `
      INSERT INTO desktop_outbox (
        client_message_id, account_id, conversation_id, content,
        state, attempt_count, next_attempt_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, 'pending', 0, ?, ?, ?)
    `,
      )
      .run(clientMessageId, accountId, conversationId, content, now, now, now);

    return this.getOutboxById(clientMessageId)!;
  }

  public listOutbox(accountId: string): DesktopOutboxEntry[] {
    const rows = this.database
      .prepare(
        `
      SELECT account_id, client_message_id, conversation_id, content,
             state, attempt_count, next_attempt_at, created_at, updated_at
      FROM desktop_outbox
      WHERE account_id = ?
      ORDER BY created_at, client_message_id
    `,
      )
      .all(accountId) as unknown as OutboxRow[];
    return rows.map(mapOutbox);
  }

  public claimNext(
    accountId: string,
    now = Date.now(),
  ): DesktopOutboxEntry | null {
    this.database.exec("BEGIN IMMEDIATE");
    try {
      const row = this.database
        .prepare(
          `
        SELECT account_id, client_message_id, conversation_id, content,
               state, attempt_count, next_attempt_at, created_at, updated_at
        FROM desktop_outbox
        WHERE account_id = ?
          AND state IN ('pending', 'failed-retryable')
          AND (next_attempt_at IS NULL OR next_attempt_at <= ?)
        ORDER BY created_at, client_message_id
        LIMIT 1
      `,
        )
        .get(accountId, now) as OutboxRow | undefined;

      if (!row) {
        this.database.exec("COMMIT");
        return null;
      }

      this.database
        .prepare(
          `
        UPDATE desktop_outbox
        SET state = 'sending', attempt_count = attempt_count + 1,
            next_attempt_at = NULL, updated_at = ?
        WHERE client_message_id = ? AND state = ?
      `,
        )
        .run(now, row.client_message_id, row.state);
      this.database.exec("COMMIT");
      return this.getOutboxById(row.client_message_id);
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }
  }

  public acknowledge(clientMessageId: string): void {
    this.database
      .prepare("DELETE FROM desktop_outbox WHERE client_message_id = ?")
      .run(clientMessageId);
  }

  public fail(
    clientMessageId: string,
    permanent: boolean,
    now = Date.now(),
  ): void {
    const existing = this.getOutboxById(clientMessageId);
    if (!existing) return;

    const delay = Math.min(
      5 * 60_000,
      1_000 * 2 ** Math.min(existing.attemptCount, 8),
    );
    this.database
      .prepare(
        `
      UPDATE desktop_outbox
      SET state = ?, next_attempt_at = ?, updated_at = ?
      WHERE client_message_id = ? AND state = 'sending'
    `,
      )
      .run(
        permanent ? "failed-permanent" : "failed-retryable",
        permanent ? null : now + delay,
        now,
        clientMessageId,
      );
  }

  private recoverInterruptedSends(now = Date.now()): void {
    this.database
      .prepare(
        `
      UPDATE desktop_outbox
      SET state = 'failed-retryable', next_attempt_at = ?, updated_at = ?
      WHERE state = 'sending'
    `,
      )
      .run(now, now);
  }

  private runMigrations(): void {
    const version = this.getSchemaVersion();
    if (version < 1) this.database.exec(migrationV1);
    if (this.getSchemaVersion() < 2) this.database.exec(migrationV2);
  }

  private ensureConversationPlaceholder(
    accountId: string,
    conversationId: string,
    now: number,
  ): void {
    this.database
      .prepare(
        `
      INSERT INTO desktop_conversations (
        account_id, conversation_id, title, last_sequence,
        member_ids_json, unread_count, updated_at
      ) VALUES (?, ?, ?, 0, '[]', 0, ?)
      ON CONFLICT(account_id, conversation_id) DO NOTHING
    `,
      )
      .run(accountId, conversationId, "Cuộc trò chuyện", now);
  }

  private getOutboxById(clientMessageId: string): DesktopOutboxEntry | null {
    const row = this.database
      .prepare(
        `
      SELECT account_id, client_message_id, conversation_id, content,
             state, attempt_count, next_attempt_at, created_at, updated_at
      FROM desktop_outbox
      WHERE client_message_id = ?
    `,
      )
      .get(clientMessageId) as OutboxRow | undefined;
    return row ? mapOutbox(row) : null;
  }
}
