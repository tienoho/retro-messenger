import assert from "node:assert/strict";
import { test } from "node:test";
import { DesktopDatabase } from "../src/main/database/desktop-database.ts";
import { DesktopRealtimeCoordinator } from "../src/main/realtime-coordinator.ts";

const accountId = "4f8ac7b6-8a35-4ef7-a72f-c73a3c0dc832";
const conversationId = "34b981ea-e24c-4506-a520-c39fb8f65c25";

test("reconnect delta sync drains every 100-message page without duplicates", async () => {
  const database = new DesktopDatabase(":memory:");
  database.upsertConversations(accountId, [
    {
      id: conversationId,
      title: "Long offline backlog",
      lastSequence: 205,
      memberIds: [accountId, crypto.randomUUID()],
    },
  ]);
  const allMessages = Array.from({ length: 205 }, (_, index) => ({
    id: crypto.randomUUID(),
    conversationId,
    senderId: crypto.randomUUID(),
    clientMessageId: crypto.randomUUID(),
    sequence: index + 1,
    type: "text",
    content: `message ${index + 1}`,
    createdAt: new Date(index * 1_000).toISOString(),
  }));
  const calls = [];
  const session = {
    getAccountId: () => accountId,
    getAccessToken: () => "token",
    listMessages: async (_conversationId, afterSequence, limit) => {
      calls.push({ afterSequence, limit });
      return allMessages
        .filter((message) => message.sequence > (afterSequence ?? 0))
        .slice(0, limit);
    },
  };
  const coordinator = new DesktopRealtimeCoordinator(
    "https://api.example.test",
    database,
    session,
    {
      onMessage() {},
      onTyping() {},
      onBuzz() {},
      onPresence() {},
      onUnreadChanged() {},
      isWindowFocused: () => false,
    },
  );

  try {
    const messages = await coordinator.listMessages(conversationId);
    assert.equal(messages.length, 205);
    assert.deepEqual(calls, [
      { afterSequence: 0, limit: 100 },
      { afterSequence: 100, limit: 100 },
      { afterSequence: 200, limit: 100 },
    ]);
    await coordinator.listMessages(conversationId);
    assert.deepEqual(calls.at(-1), { afterSequence: 205, limit: 100 });
    assert.equal(database.listMessages(accountId, conversationId).length, 205);
  } finally {
    database.close();
  }
});
