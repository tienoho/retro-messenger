import type { MessageDto } from "@retro/contracts";
import type { OutboxEntry } from "@retro/chat-core";

const DB_NAME = "retro-messenger-web";
const DB_VERSION = 2;

type StoredMessage = MessageDto & { accountId: string };
type StoredOutboxEntry = OutboxEntry & { accountId: string };

function transactionCompleted(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

export class IndexedDbAdapter {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDb(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === "undefined" || !("indexedDB" in window)) {
        reject(new Error("IndexedDB not supported"));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = event => {
        const db = request.result;
        if (event.oldVersion < 2) {
          if (db.objectStoreNames.contains("messages")) {
            db.deleteObjectStore("messages");
          }
          if (db.objectStoreNames.contains("outbox")) {
            db.deleteObjectStore("outbox");
          }
        }

        if (!db.objectStoreNames.contains("messages")) {
          const messageStore = db.createObjectStore("messages", {
            keyPath: ["accountId", "id"],
          });
          messageStore.createIndex(
            "byAccountConversation",
            ["accountId", "conversationId"],
            { unique: false },
          );
        }

        if (!db.objectStoreNames.contains("outbox")) {
          const outboxStore = db.createObjectStore("outbox", {
            keyPath: ["accountId", "clientMessageId"],
          });
          outboxStore.createIndex("byAccount", "accountId", { unique: false });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  public async saveMessages(accountId: string, messages: MessageDto[]): Promise<void> {
    try {
      const db = await this.getDb();
      const transaction = db.transaction("messages", "readwrite");
      const store = transaction.objectStore("messages");
      for (const message of messages) {
        const stored: StoredMessage = { ...message, accountId };
        store.put(stored);
      }
      await transactionCompleted(transaction);
    } catch {
      // The server remains the source of truth when IndexedDB is unavailable.
    }
  }

  public async getMessages(accountId: string, conversationId: string): Promise<MessageDto[]> {
    try {
      const db = await this.getDb();
      return await new Promise(resolve => {
        const transaction = db.transaction("messages", "readonly");
        const index = transaction.objectStore("messages").index("byAccountConversation");
        const request = index.getAll([accountId, conversationId]);
        request.onsuccess = () => resolve(
          (request.result as StoredMessage[]).map(({ accountId: _, ...message }) => message),
        );
        request.onerror = () => resolve([]);
      });
    } catch {
      return [];
    }
  }

  public async saveOutbox(accountId: string, entries: OutboxEntry[]): Promise<void> {
    try {
      const db = await this.getDb();
      const transaction = db.transaction("outbox", "readwrite");
      const store = transaction.objectStore("outbox");
      const keyRequest = store.index("byAccount").getAllKeys(accountId);

      keyRequest.onsuccess = () => {
        for (const key of keyRequest.result) {
          store.delete(key);
        }
        for (const entry of entries) {
          const stored: StoredOutboxEntry = { ...entry, accountId };
          store.put(stored);
        }
      };

      await transactionCompleted(transaction);
    } catch {
      // The in-memory outbox remains available for the current page lifetime.
    }
  }

  public async getOutbox(accountId: string): Promise<OutboxEntry[]> {
    try {
      const db = await this.getDb();
      return await new Promise(resolve => {
        const transaction = db.transaction("outbox", "readonly");
        const request = transaction.objectStore("outbox").index("byAccount").getAll(accountId);
        request.onsuccess = () => resolve(
          (request.result as StoredOutboxEntry[]).map(({ accountId: _, ...entry }) => entry),
        );
        request.onerror = () => resolve([]);
      });
    } catch {
      return [];
    }
  }
}

export const localDb = new IndexedDbAdapter();
