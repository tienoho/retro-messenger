BEGIN;

CREATE TABLE IF NOT EXISTS contacts.contact_requests (
    id uuid PRIMARY KEY,
    sender_id uuid NOT NULL,
    recipient_id uuid NOT NULL,
    status varchar(32) NOT NULL,
    created_at timestamptz NOT NULL,
    responded_at timestamptz,
    CONSTRAINT fk_contact_requests_sender
        FOREIGN KEY (sender_id) REFERENCES users.profiles (id) ON DELETE CASCADE,
    CONSTRAINT fk_contact_requests_recipient
        FOREIGN KEY (recipient_id) REFERENCES users.profiles (id) ON DELETE CASCADE,
    CONSTRAINT ck_contact_requests_distinct_users CHECK (sender_id <> recipient_id),
    CONSTRAINT ck_contact_requests_status CHECK (status IN ('pending', 'accepted', 'rejected')),
    CONSTRAINT uq_contact_requests_direction UNIQUE (sender_id, recipient_id)
);

CREATE INDEX IF NOT EXISTS ix_contact_requests_recipient_status_created
    ON contacts.contact_requests (recipient_id, status, created_at);

CREATE TABLE IF NOT EXISTS contacts.contact_relationships (
    user_id uuid NOT NULL,
    contact_id uuid NOT NULL,
    status varchar(32) NOT NULL,
    group_name varchar(64) NOT NULL,
    created_at timestamptz NOT NULL,
    CONSTRAINT pk_contact_relationships PRIMARY KEY (user_id, contact_id),
    CONSTRAINT fk_contact_relationships_user
        FOREIGN KEY (user_id) REFERENCES users.profiles (id) ON DELETE CASCADE,
    CONSTRAINT fk_contact_relationships_contact
        FOREIGN KEY (contact_id) REFERENCES users.profiles (id) ON DELETE CASCADE,
    CONSTRAINT ck_contact_relationships_distinct_users CHECK (user_id <> contact_id),
    CONSTRAINT ck_contact_relationships_status CHECK (status IN ('accepted', 'blocked'))
);

COMMIT;
