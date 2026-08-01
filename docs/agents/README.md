# Retro Messenger — AI Agent Pack

Bộ tài liệu điều phối AI coding đã được kiểm định cho backend .NET, React Web, Electron Desktop, React Native Mobile, Admin Portal và hạ tầng Retro Messenger.

## Mục tiêu

- Giúp AI hiểu đúng kiến trúc trước khi sửa mã.
- Cung cấp agent và skill được từng công cụ tự động nhận diện.
- Chuẩn hóa workflow, kiểm thử, review và handoff.
- Ngăn thay đổi phá vỡ transaction, idempotency, security hoặc contract.

## Cài vào repository

Giải nén nội dung của gói vào **root repository Retro Messenger**, không đặt nguyên cả thư mục gói bên trong một thư mục con.

```text
<repo-root>/
  AGENTS.md
  CLAUDE.md
  GEMINI.md
  .claude/
  .gemini/
  .agents/
  .github/
  .cursor/
  agents/
  skills/
  workflows/
  checklists/
  templates/
  docs/
```

## Dùng nhanh

1. Bắt đầu bằng `AGENTS.md`.
2. Dùng `docs/AGENT_ROUTING.md` để chọn agent.
3. Chọn workflow phù hợp trong `workflows/`.
4. Dùng template trong `templates/` để giao task và handoff.
5. Chạy `python scripts/validate_agent_pack.py` sau khi thay đổi tài liệu agent.

## Hỗ trợ công cụ

- OpenAI Codex: `AGENTS.md`.
- Claude Code: `CLAUDE.md`, `.claude/agents`, `.claude/skills`.
- Gemini CLI: `GEMINI.md`, `.gemini/agents`, `.agents/skills`.
- GitHub Copilot: `.github/copilot-instructions.md`, `.github/agents`, `.github/instructions`.
- Cursor: `.cursor/rules`.

Chi tiết: `docs/TOOL_COMPATIBILITY.md`.

## Nguồn chuẩn và adapter

- Chỉnh nội dung chuyên môn trong `agents/` và `skills/`.
- Các thư mục ẩn theo công cụ là adapter được sinh ra.
- Sau khi sửa nguồn chuẩn, chạy generator và validator.

## Nguyên tắc cốt lõi

- PostgreSQL là nguồn dữ liệu nghiệp vụ chính.
- SignalR là kênh realtime, không phải message store.
- Redis không phải nguồn lưu message.
- Message chỉ được phát realtime sau khi transaction commit.
- Mỗi message có `client_message_id` và conversation sequence.
- Client có local outbox và sync cursor.
- Mobile nền dùng push; resume phải sync.
- Electron renderer không truy cập Node.js trực tiếp.
- Admin frontend không thay thế authorization phía backend.

## Tài liệu quan trọng

- `AGENTS.md`
- `docs/PROJECT_CONTEXT.md`
- `docs/AGENT_ROUTING.md`
- `docs/TOOL_COMPATIBILITY.md`
- `docs/VALIDATION_REPORT.md`
- `checklists/definition-of-done.md`
