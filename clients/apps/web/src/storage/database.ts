export interface LocalOutboxRecord {
  clientMessageId: string;
  conversationId: string;
  content: string;
  state: "pending" | "sending" | "failed";
  createdAt: string;
}

export const webStoragePlan = {
  databaseName: "retro-messenger-web",
  stores: ["messages", "outbox", "syncState", "drafts"],
} as const;
