BEGIN;

CREATE TABLE IF NOT EXISTS media.attachments (
    id uuid PRIMARY KEY,
    conversation_id uuid NOT NULL REFERENCES chat.conversations(id) ON DELETE CASCADE,
    uploader_id uuid NOT NULL REFERENCES users.profiles(id) ON DELETE CASCADE,
    file_name varchar(255) NOT NULL,
    content_type varchar(100) NOT NULL,
    file_size_bytes bigint NOT NULL,
    object_key varchar(500) NOT NULL,
    status varchar(32) NOT NULL DEFAULT 'pending',
    thumbnail_key varchar(500),
    quarantine_reason text,
    created_at timestamptz NOT NULL DEFAULT now(),
    scanned_at timestamptz,
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_attachments_status ON media.attachments(status);
CREATE INDEX IF NOT EXISTS ix_attachments_uploader ON media.attachments(uploader_id);
CREATE INDEX IF NOT EXISTS ix_attachments_conversation ON media.attachments(conversation_id);

ALTER TABLE chat.outbox_messages
    ADD COLUMN IF NOT EXISTS retry_count int NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS is_quarantined boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS quarantined_at timestamptz;

COMMIT;
