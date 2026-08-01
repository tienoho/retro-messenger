import assert from "node:assert/strict";
import { test } from "node:test";
import { DesktopDatabase } from "../src/main/database/desktop-database.ts";
import { DesktopOutboxProcessor } from "../src/main/outbox-processor.ts";
import { DesktopApiError } from "../src/main/session-manager.ts";

const accountId = "4f8ac7b6-8a35-4ef7-a72f-c73a3c0dc832";
const conversationId = "34b981ea-e24c-4506-a520-c39fb8f65c25";
const messageId = "8016120c-fab0-4d3e-bd9d-b272514bf8c1";

test("outbox processor acknowledges a successful idempotent send", async () => {
  const database = new DesktopDatabase(":memory:");
  const delivered = [];
  database.enqueue(accountId, conversationId, messageId, "hello", Date.now());
  const message = {
    id: crypto.randomUUID(),
    conversationId,
    senderId: accountId,
    clientMessageId: messageId,
    sequence: 1,
    type: "text",
    content: "hello",
    createdAt: new Date().toISOString(),
  };
  const session = {
    getAccountId: () => accountId,
    sendMessage: async () => ({ message, isDuplicate: false }),
  };

  try {
    const processor = new DesktopOutboxProcessor(database, session, (item) =>
      delivered.push(item),
    );
    await processor.flush();
    assert.deepEqual(delivered, [message]);
    assert.deepEqual(database.listOutbox(accountId), []);
  } finally {
    database.close();
  }
});

test("outbox processor distinguishes retryable and permanent API failures", async () => {
  for (const [status, expectedState] of [
    [503, "failed-retryable"],
    [403, "failed-permanent"],
  ]) {
    const database = new DesktopDatabase(":memory:");
    database.enqueue(accountId, conversationId, messageId, "hello", Date.now());
    const session = {
      getAccountId: () => accountId,
      sendMessage: async () => {
        throw new DesktopApiError(status, "failed");
      },
    };

    try {
      const processor = new DesktopOutboxProcessor(database, session, () => {});
      await processor.flush();
      assert.equal(database.listOutbox(accountId)[0]?.state, expectedState);
    } finally {
      database.close();
    }
  }
});
