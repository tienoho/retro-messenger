BEGIN;

INSERT INTO users.profiles(id, username, display_name, status)
VALUES
('11111111-1111-1111-1111-111111111111', 'demo-user', 'Bạn', 'online'),
('22222222-2222-2222-2222-222222222222', 'hong-anh', 'Hồng Anh', 'online')
ON CONFLICT (id) DO NOTHING;

INSERT INTO chat.conversations(id, title, last_sequence)
VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Hồng Anh', 0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO chat.conversation_members(conversation_id, user_id)
VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222')
ON CONFLICT DO NOTHING;

COMMIT;
