import type { MessageDto } from "@retro/contracts";

export type OutboxState =
  | "pending"
  | "sending"
  | "acknowledged"
  | "failed-retryable"
  | "failed-permanent";

export interface OutboxEntry {
  clientMessageId: string;
  conversationId: string;
  content: string;
  state: OutboxState;
  attemptCount: number;
  nextAttemptAt?: string;
}

export function mergeMessages(
  current: MessageDto[],
  incoming: MessageDto[],
): MessageDto[] {
  const byId = new Map<string, MessageDto>();

  for (const item of current) byId.set(item.id, item);
  for (const item of incoming) byId.set(item.id, item);

  return [...byId.values()].sort((a, b) => a.sequence - b.sequence);
}

export function hasSequenceGap(messages: MessageDto[]): boolean {
  const sorted = [...messages].sort((a, b) => a.sequence - b.sequence);

  for (let index = 1; index < sorted.length; index++) {
    const previous = sorted[index - 1];
    const current = sorted[index];

    if (
      previous &&
      current &&
      current.sequence !== previous.sequence + 1
    ) {
      return true;
    }
  }

  return false;
}

export class ClientOutboxManager {
  private queue: OutboxEntry[] = [];

  constructor(initialEntries: OutboxEntry[] = []) {
    this.hydrate(initialEntries);
  }

  public hydrate(entries: OutboxEntry[]): void {
    const uniqueEntries = new Map<string, OutboxEntry>();
    for (const entry of entries) {
      uniqueEntries.set(entry.clientMessageId, {
        ...entry,
        state: entry.state === "sending" ? "failed-retryable" : entry.state,
      });
    }
    this.queue = [...uniqueEntries.values()];
  }

  public enqueue(conversationId: string, content: string, clientMessageId: string): OutboxEntry {
    const entry: OutboxEntry = {
      clientMessageId,
      conversationId,
      content,
      state: "pending",
      attemptCount: 0,
    };
    this.queue.push(entry);
    return entry;
  }

  public getPending(): OutboxEntry[] {
    return this.queue.filter(e => e.state === "pending" || e.state === "failed-retryable");
  }

  public markSending(clientMessageId: string): void {
    const item = this.queue.find(e => e.clientMessageId === clientMessageId);
    if (item) {
      item.state = "sending";
      item.attemptCount++;
    }
  }

  public markAcknowledged(clientMessageId: string): void {
    this.queue = this.queue.filter(e => e.clientMessageId !== clientMessageId);
  }

  public markFailed(clientMessageId: string, permanent = false): void {
    const item = this.queue.find(e => e.clientMessageId === clientMessageId);
    if (item) {
      item.state = permanent ? "failed-permanent" : "failed-retryable";
    }
  }

  public getAll(): OutboxEntry[] {
    return [...this.queue];
  }
}

export class SyncCursorManager {
  private cursors = new Map<string, number>();

  public getCursor(conversationId: string): number {
    return this.cursors.get(conversationId) ?? 0;
  }

  public updateCursor(conversationId: string, sequence: number): void {
    const current = this.getCursor(conversationId);
    if (sequence > current) {
      this.cursors.set(conversationId, sequence);
    }
  }
}
