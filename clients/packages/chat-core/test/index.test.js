import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ClientOutboxManager } from "../src/index.ts";

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
