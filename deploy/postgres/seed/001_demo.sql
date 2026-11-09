BEGIN;

INSERT INTO "AspNetUsers"(
    "Id", "DisplayName", "Status", "CustomStatus", "CreatedAt", "UpdatedAt",
    "UserName", "NormalizedUserName", "Email", "NormalizedEmail", "EmailConfirmed",
    "PasswordHash", "SecurityStamp", "ConcurrencyStamp", "PhoneNumberConfirmed",
    "TwoFactorEnabled", "LockoutEnabled", "AccessFailedCount"
)
VALUES
(
    '01a1bbed-9e69-706b-906f-bdef2bef3012', 'Hồng Anh', 'online', '♫ Đang nghe nhạc Yahoo! 360', NOW(), NOW(),
    'honganh', 'HONGANH', 'honganh@retro.local', 'HONGANH@RETRO.LOCAL', true,
    'AQAAAAIAAYagAAAAEJW0NiV/UVY4VJOd+yetFMECd0FUQaWK4Wo5mdmmjxbJx5759c3oW9omHq+hZ/LAPg==', 'SECU-HONGANH', 'CONC-HONGANH', false,
    false, true, 0
),
(
    '01a1bbed-c321-72f7-b42d-c8e9553fd784', 'Hoàng Nam', 'online', '♫ Yahoo Messenger 2000s vibes', NOW(), NOW(),
    'hoangnam', 'HOANGNAM', 'hoangnam@retro.local', 'HOANGNAM@RETRO.LOCAL', true,
    'AQAAAAIAAYagAAAAEAmjACzb/WfCIY3TcG8ARE1Utp4kDXakWQ++6lBOaEO6Ci6wZhMF62XEikWT77x4Sw==', 'SECU-HOANGNAM', 'CONC-HOANGNAM', false,
    false, true, 0
)
ON CONFLICT ("Id") DO NOTHING;

INSERT INTO users.profiles(id, username, display_name, status, custom_status)
VALUES
('01a1bbed-9e69-706b-906f-bdef2bef3012', 'honganh', 'Hồng Anh', 'online', '♫ Đang nghe nhạc Yahoo! 360'),
('01a1bbed-c321-72f7-b42d-c8e9553fd784', 'hoangnam', 'Hoàng Nam', 'online', '♫ Yahoo Messenger 2000s vibes')
ON CONFLICT (id) DO UPDATE SET custom_status = EXCLUDED.custom_status;

INSERT INTO contacts.contact_relationships(user_id, contact_id, status, group_name, created_at)
VALUES
('01a1bbed-9e69-706b-906f-bdef2bef3012', '01a1bbed-c321-72f7-b42d-c8e9553fd784', 'accepted', 'Bạn bè', NOW()),
('01a1bbed-c321-72f7-b42d-c8e9553fd784', '01a1bbed-9e69-706b-906f-bdef2bef3012', 'accepted', 'Bạn bè', NOW())
ON CONFLICT (user_id, contact_id) DO UPDATE SET status = 'accepted';

INSERT INTO chat.conversations(id, title, last_sequence)
VALUES
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Hoàng Nam & Hồng Anh', 0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO chat.conversation_members(conversation_id, user_id)
VALUES
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '01a1bbed-9e69-706b-906f-bdef2bef3012'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '01a1bbed-c321-72f7-b42d-c8e9553fd784')
ON CONFLICT DO NOTHING;

COMMIT;
