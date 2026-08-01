import * as SQLite from "expo-sqlite";

export async function openMessengerDatabase() {
  const database = await SQLite.openDatabaseAsync(
    "retro-messenger.db",
  );

  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS local_sync_state (
      account_id TEXT PRIMARY KEY NOT NULL,
      sync_cursor TEXT,
      updated_at TEXT NOT NULL
    );
  `);

  return database;
}
