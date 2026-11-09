import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ClientOutboxManager, mergeMessages } from "../src/index.ts";

describe("ClientOutboxManager", () => {
  it("recovers interrupted sends as retryable and deduplicates hydrated entries", () => {
    const manager = new ClientOutboxManager();
    manager.hydrate([
      {
        clientMessageId: "message-1",
        conversationId: "conversation-1",
        content: "first",
        state: "sending",
        attemptCount: 1,
      },
      {
        clientMessageId: "message-1",
        conversationId: "conversation-1",
        content: "latest",
        state: "pending",
        attemptCount: 1,
      },
    ]);

    assert.deepStrictEqual(manager.getPending(), [
      {
        clientMessageId: "message-1",
        conversationId: "conversation-1",
        content: "latest",
        state: "pending",
        attemptCount: 1,
      },
    ]);
  });

  it("recovers a single sending entry after process interruption", () => {
    const manager = new ClientOutboxManager([
      {
        clientMessageId: "message-2",
        conversationId: "conversation-1",
        content: "retry me",
        state: "sending",
        attemptCount: 1,
      },
    ]);

    assert.strictEqual(manager.getPending()[0]?.state, "failed-retryable");
  });
});

describe("mergeMessages", () => {
  it("replaces optimistic message when server confirmed message with matching clientMessageId arrives", () => {
    const optimistic = {
      id: "client-uuid-1",
      clientMessageId: "client-uuid-1",
      conversationId: "conv-1",
      senderId: "user-1",
      sequence: 1,
      type: 1,
      content: "Hello world",
      createdAt: "2026-11-09T12:00:00Z",
      editedAt: null,
      deletedAt: null,
    };

    const server = {
      id: "server-db-uuid-2",
      clientMessageId: "client-uuid-1",
      conversationId: "conv-1",
      senderId: "user-1",
      sequence: 1,
      type: 1,
      content: "Hello world",
      createdAt: "2026-11-09T12:00:01Z",
      editedAt: null,
      deletedAt: null,
    };

    const initial = mergeMessages([], [optimistic]);
    assert.strictEqual(initial.length, 1);
    assert.strictEqual(initial[0]?.id, "client-uuid-1");

    // Server response arrives
    const merged = mergeMessages(initial, [server]);
    assert.strictEqual(merged.length, 1, "Must contain exactly 1 message, no duplicates");
    assert.strictEqual(merged[0]?.id, "server-db-uuid-2");

    // Subsequent SignalR event delivers the same message again
    const afterSignalR = mergeMessages(merged, [server]);
    assert.strictEqual(afterSignalR.length, 1, "SignalR broadcast must not duplicate message");
    assert.strictEqual(afterSignalR[0]?.id, "server-db-uuid-2");
  });

  it("purges and heals previously duplicated messages from corrupted cache", () => {
    const optimistic = {
      id: "client-uuid-1",
      clientMessageId: "client-uuid-1",
      conversationId: "conv-1",
      senderId: "user-1",
      sequence: 1,
      type: 1,
      content: "Hello world",
      createdAt: "2026-11-09T12:00:00Z",
      editedAt: null,
      deletedAt: null,
    };

    const server = {
      id: "server-db-uuid-2",
      clientMessageId: "client-uuid-1",
      conversationId: "conv-1",
      senderId: "user-1",
      sequence: 1,
      type: 1,
      content: "Hello world",
      createdAt: "2026-11-09T12:00:01Z",
      editedAt: null,
      deletedAt: null,
    };

    // Both were saved to cache in older buggy code
    const corruptedCache = [optimistic, server];
    const cleaned = mergeMessages([], corruptedCache);

    assert.strictEqual(cleaned.length, 1, "Must heal and drop duplicate optimistic placeholder");
    assert.strictEqual(cleaned[0]?.id, "server-db-uuid-2");
  });
});
