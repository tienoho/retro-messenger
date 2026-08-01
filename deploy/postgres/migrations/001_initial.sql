BEGIN;

CREATE SCHEMA IF NOT EXISTS chat;
CREATE SCHEMA IF NOT EXISTS users;
CREATE SCHEMA IF NOT EXISTS contacts;
CREATE SCHEMA IF NOT EXISTS rooms;
CREATE SCHEMA IF NOT EXISTS media;
CREATE SCHEMA IF NOT EXISTS calls;
CREATE SCHEMA IF NOT EXISTS moderation;

CREATE TABLE IF NOT EXISTS users.profiles (
    id uuid PRIMARY KEY,
    username varchar(64) NOT NULL UNIQUE,
    display_name varchar(120) NOT NULL,
    status varchar(32) NOT NULL DEFAULT 'offline',
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chat.conversations (
    id uuid PRIMARY KEY,
    title varchar(200) NOT NULL,
    conversation_type smallint NOT NULL DEFAULT 1,
    last_sequence bigint NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chat.conversation_members (
    conversation_id uuid NOT NULL REFERENCES chat.conversations(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES users.profiles(id) ON DELETE CASCADE,
    role smallint NOT NULL DEFAULT 1,
    joined_at timestamptz NOT NULL DEFAULT now(),
    last_read_sequence bigint NOT NULL DEFAULT 0,
    PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS chat.messages (
    id uuid PRIMARY KEY,
    conversation_id uuid NOT NULL REFERENCES chat.conversations(id) ON DELETE CASCADE,
    sender_id uuid NOT NULL REFERENCES users.profiles(id),
    client_message_id varchar(100) NOT NULL,
    sequence_no bigint NOT NULL,
    message_type smallint NOT NULL,
    content text NOT NULL DEFAULT '',
    created_at timestamptz NOT NULL,
    edited_at timestamptz,
    deleted_at timestamptz,
    UNIQUE (sender_id, client_message_id),
    UNIQUE (conversation_id, sequence_no)
);

CREATE INDEX IF NOT EXISTS ix_messages_conversation_created
    ON chat.messages(conversation_id, created_at DESC);

CREATE TABLE IF NOT EXISTS chat.outbox_messages (
    id uuid PRIMARY KEY,
    event_type varchar(200) NOT NULL,
    payload jsonb NOT NULL,
    occurred_at timestamptz NOT NULL,
    processed_at timestamptz,
    error text
);

COMMIT;
