CREATE TABLE IF NOT EXISTS local_messages (
  id TEXT PRIMARY KEY NOT NULL,
  client_message_id TEXT,
  conversation_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  sequence_no INTEGER,
  payload_json TEXT NOT NULL,
  message_state TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_local_client_message
ON local_messages(client_message_id)
WHERE client_message_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS local_outbox (
  client_message_id TEXT PRIMARY KEY NOT NULL,
  conversation_id TEXT NOT NULL,
  request_json TEXT NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  next_attempt_at TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS local_sync_state (
  account_id TEXT PRIMARY KEY NOT NULL,
  sync_cursor TEXT,
  updated_at TEXT NOT NULL
);
