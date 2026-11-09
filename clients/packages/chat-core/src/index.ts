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
  const all = [...current];

  for (const item of incoming) {
    const index = all.findIndex(
      existing =>
        existing.id === item.id ||
        (item.clientMessageId && existing.clientMessageId === item.clientMessageId) ||
        (item.clientMessageId && existing.id === item.clientMessageId) ||
        (existing.clientMessageId && existing.clientMessageId === item.id),
    );

    if (index !== -1) {
      all[index] = item;
    } else {
      all.push(item);
    }
  }

  // Prioritize authoritative server records (where id !== clientMessageId) over local optimistic placeholders
  all.sort((a, b) => {
    const aIsServer = a.clientMessageId ? a.id !== a.clientMessageId : true;
    const bIsServer = b.clientMessageId ? b.id !== b.clientMessageId : true;
    if (aIsServer !== bIsServer) {
      return aIsServer ? -1 : 1;
    }
    return a.sequence - b.sequence;
  });

  const finalMessages: MessageDto[] = [];
  const seenIds = new Set<string>();
  const seenClientIds = new Set<string>();

  for (const msg of all) {
    if (seenIds.has(msg.id)) continue;
    if (msg.clientMessageId && seenClientIds.has(msg.clientMessageId)) continue;

    seenIds.add(msg.id);
    if (msg.clientMessageId) {
      seenClientIds.add(msg.clientMessageId);
      seenIds.add(msg.clientMessageId);
    }
    finalMessages.push(msg);
  }

  return finalMessages.sort((a, b) => a.sequence - b.sequence);
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
