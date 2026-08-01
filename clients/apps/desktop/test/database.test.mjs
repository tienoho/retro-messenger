import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { DesktopDatabase } from "../src/main/database/desktop-database.ts";

const accountId = "4f8ac7b6-8a35-4ef7-a72f-c73a3c0dc832";
const conversationId = "34b981ea-e24c-4506-a520-c39fb8f65c25";
const messageId = "8016120c-fab0-4d3e-bd9d-b272514bf8c1";

test("SQLite migration is repeatable and recovers an interrupted send", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "retro-desktop-"));
  const databasePath = path.join(directory, "desktop.sqlite3");

  try {
    const first = new DesktopDatabase(databasePath);
    assert.equal(first.getSchemaVersion(), 2);
    first.enqueue(accountId, conversationId, messageId, "hello", 1_000);
    const claimed = first.claimNext(accountId, 1_000);
    assert.equal(claimed?.state, "sending");
    assert.equal(claimed?.attemptCount, 1);
    first.close();

    const reopened = new DesktopDatabase(databasePath);
    assert.equal(reopened.getSchemaVersion(), 2);
    const recovered = reopened.listOutbox(accountId);
    assert.equal(recovered.length, 1);
    assert.equal(recovered[0]?.state, "failed-retryable");
    assert.ok(Date.parse(recovered[0]?.nextAttemptAt ?? "") <= Date.now());
    reopened.close();
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("message cache deduplicates realtime delivery and tracks unread per account", () => {
  const database = new DesktopDatabase(":memory:");
  try {
    database.upsertConversations(
      accountId,
      [
        {
          id: conversationId,
          title: "Retro room",
          lastSequence: 0,
          memberIds: [accountId, crypto.randomUUID()],
        },
      ],
      1_000,
    );
    const message = {
      id: crypto.randomUUID(),
      conversationId,
      senderId: crypto.randomUUID(),
      clientMessageId: crypto.randomUUID(),
      sequence: 1,
      type: "text",
      content: "hello from realtime",
      createdAt: new Date(1_000).toISOString(),
    };

    assert.equal(database.upsertMessage(accountId, message, true, 1_000), true);
    assert.equal(
      database.upsertMessage(accountId, message, true, 2_000),
      false,
    );
    assert.equal(database.getUnreadCount(accountId), 1);
    assert.deepEqual(database.listMessages(accountId, conversationId), [
      {
        ...message,
        editedAt: null,
        deletedAt: null,
      },
    ]);
    database.markConversationRead(accountId, conversationId);
    assert.equal(database.getUnreadCount(accountId), 0);
  } finally {
    database.close();
  }
});

test("outbox acknowledgement and message cache commit together", () => {
  const database = new DesktopDatabase(":memory:");
  try {
    database.enqueue(accountId, conversationId, messageId, "queued", 1_000);
    const message = {
      id: crypto.randomUUID(),
      conversationId,
      senderId: accountId,
      clientMessageId: messageId,
      sequence: 1,
      type: "text",
      content: "queued",
      createdAt: new Date(1_500).toISOString(),
    };
    database.acknowledgeWithMessage(accountId, message);
    assert.equal(database.listOutbox(accountId).length, 0);
    assert.equal(
      database.listMessages(accountId, conversationId)[0]?.id,
      message.id,
    );
  } finally {
    database.close();
  }
});

test("outbox enqueue is idempotent and rejects client ID reuse", () => {
  const database = new DesktopDatabase(":memory:");
  try {
    const first = database.enqueue(
      accountId,
      conversationId,
      messageId,
      "same content",
      1_000,
    );
    const duplicate = database.enqueue(
      accountId,
      conversationId,
      messageId,
      "same content",
      2_000,
    );
    assert.deepEqual(duplicate, first);
    assert.throws(
      () =>
        database.enqueue(
          accountId,
          conversationId,
          messageId,
          "changed",
          3_000,
        ),
      /different content/,
    );
  } finally {
    database.close();
  }
});

test("retry backoff prevents an immediate hot loop", () => {
  const database = new DesktopDatabase(":memory:");
  try {
    database.enqueue(accountId, conversationId, messageId, "retry", 1_000);
    database.claimNext(accountId, 1_000);
    database.fail(messageId, false, 1_000);

    const failed = database.listOutbox(accountId)[0];
    assert.equal(failed?.state, "failed-retryable");
    assert.equal(failed?.nextAttemptAt, new Date(3_000).toISOString());
    assert.equal(database.claimNext(accountId, 2_999), null);
    assert.equal(database.claimNext(accountId, 3_000)?.attemptCount, 2);
  } finally {
    database.close();
  }
});
