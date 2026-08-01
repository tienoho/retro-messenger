# Module Boundaries

| Module | Ownership |
|---|---|
| Identity | credentials, token, session |
| Users | profile, privacy, device |
| Contacts | friend, request, block, contact group |
| Messaging | conversation, message, receipt, reaction |
| Presence | online session, typing |
| Rooms | public/private room, membership, moderation state |
| Media | upload, attachment, variants |
| Calls | call and participant state |
| Notifications | inbox and push delivery |
| Moderation | report, case, action and audit |

Một module không sửa trực tiếp dữ liệu của module khác. Giao tiếp thông qua application command hoặc integration event.
