BEGIN;

CREATE SCHEMA IF NOT EXISTS admin;

CREATE TABLE IF NOT EXISTS admin.audit_logs (
    id uuid PRIMARY KEY,
    actor_id uuid NOT NULL,
    action varchar(64) NOT NULL,
    target_type varchar(64) NOT NULL,
    target_id uuid NOT NULL,
    reason varchar(500) NOT NULL,
    occurred_at timestamptz NOT NULL,
    CONSTRAINT fk_admin_audit_actor
        FOREIGN KEY (actor_id) REFERENCES users.profiles (id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS ix_admin_audit_logs_occurred_at
    ON admin.audit_logs (occurred_at DESC);

CREATE INDEX IF NOT EXISTS ix_admin_audit_logs_actor_id
    ON admin.audit_logs (actor_id);

INSERT INTO "AspNetRoles" ("Id", "Name", "NormalizedName", "ConcurrencyStamp")
VALUES (
    'aaaaaaaa-0000-0000-0000-000000000001',
    'admin',
    'ADMIN',
    'retro-admin-role-v1')
ON CONFLICT DO NOTHING;

COMMIT;
