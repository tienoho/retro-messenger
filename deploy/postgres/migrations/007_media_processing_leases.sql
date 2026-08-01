BEGIN;

ALTER TABLE media.attachments
    ADD COLUMN IF NOT EXISTS processing_owner uuid,
    ADD COLUMN IF NOT EXISTS processing_lease_until timestamptz,
    ADD COLUMN IF NOT EXISTS processing_attempts int NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS next_processing_at timestamptz,
    ADD COLUMN IF NOT EXISTS last_processing_error text,
    ADD COLUMN IF NOT EXISTS cleanup_owner uuid,
    ADD COLUMN IF NOT EXISTS cleanup_lease_until timestamptz,
    ADD COLUMN IF NOT EXISTS storage_deleted_at timestamptz,
    ADD COLUMN IF NOT EXISTS last_cleanup_error text;

ALTER TABLE media.attachments
    ALTER COLUMN next_processing_at SET DEFAULT now();

CREATE INDEX IF NOT EXISTS ix_attachments_processing_queue
    ON media.attachments((COALESCE(next_processing_at, created_at)), created_at)
    WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS ix_attachments_processing_lease
    ON media.attachments(processing_lease_until, created_at)
    WHERE status = 'processing';

CREATE INDEX IF NOT EXISTS ix_attachments_cleanup_queue
    ON media.attachments(updated_at, created_at)
    WHERE storage_deleted_at IS NULL
      AND status IN ('uploading', 'failed', 'quarantined');

COMMIT;
