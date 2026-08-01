# Tool Compatibility

Bộ tài liệu có một lớp nội dung chuẩn và các adapter theo công cụ. Không chỉnh adapter trước; chỉnh file chuẩn rồi đồng bộ lại.

## Nguồn chuẩn

- `AGENTS.md`: quy tắc repository.
- `agents/*.md`: mô tả chuyên gia độc lập với công cụ.
- `skills/*/SKILL.md`: Agent Skills chuẩn có YAML frontmatter.
- `workflows/*.md`: quy trình.
- `checklists/*.md`: cổng chất lượng.

## Adapter tự động nhận diện

| Công cụ        | Instructions                                     | Agents                                                            | Skills/Rules                                                             |
| -------------- | ------------------------------------------------ | ----------------------------------------------------------------- | ------------------------------------------------------------------------ |
| OpenAI Codex   | `AGENTS.md`                                      | Dùng routing trong `AGENTS.md`; `CODEX.md` chỉ là quick reference | Đọc skill khi task yêu cầu                                               |
| Claude Code    | `CLAUDE.md`                                      | `.claude/agents/*.md`                                             | `.claude/skills/*/SKILL.md`                                              |
| Gemini CLI     | `GEMINI.md`                                      | `.gemini/agents/*.md`                                             | `.agents/skills/*/SKILL.md`                                              |
| GitHub Copilot | `.github/copilot-instructions.md` và `AGENTS.md` | `.github/agents/*.agent.md`                                       | `.github/instructions/*.instructions.md`; skills trong `.agents/skills/` |
| Cursor         | `AGENTS.md` khi được tool hỗ trợ                 | Không phụ thuộc custom-agent format                               | `.cursor/rules/*.mdc`                                                    |

## Đồng bộ

Sau khi sửa agent hoặc skill chuẩn, chạy:

```bash
python scripts/generate_tool_adapters.py
python scripts/validate_agent_pack.py
```

## Reload

- Claude Code: restart session hoặc dùng `/agents` để quản lý lại agent; skill được phát hiện khi session khởi động.
- Gemini CLI: `/agents reload`, `/skills reload`, `/memory reload`.
- Cursor: reload window nếu rule mới chưa xuất hiện.
- Copilot: lưu file; một số agent profile cần reload IDE hoặc phiên agent.

## Ghi chú

- `CODEX.md` không thay thế `AGENTS.md`.
- `agents/` ở root là nguồn chuẩn, không phải thư mục auto-discovery chung cho mọi công cụ.
- Các adapter tool-specific có thể khác frontmatter dù phần prompt nghiệp vụ tương đương.

## Tài liệu chính thức đã đối chiếu

- [OpenAI Codex và AGENTS.md](https://openai.com/index/introducing-codex/)
- [Claude Code custom subagents](https://code.claude.com/docs/en/sub-agents)
- [Claude Code Agent Skills](https://code.claude.com/docs/en/skills)
- [Gemini CLI context files](https://geminicli.com/docs/cli/gemini-md/)
- [Gemini CLI custom subagents](https://geminicli.com/docs/core/subagents/)
- [Gemini CLI Agent Skills](https://geminicli.com/docs/cli/skills/)
- [GitHub Copilot custom agents](https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/customize-cloud-agent/create-custom-agents)
- [GitHub Copilot repository instructions](https://docs.github.com/en/copilot/how-tos/configure-custom-instructions-in-your-ide/add-repository-instructions-in-your-ide)
- [Cursor project rules](https://docs.cursor.com/context/rules)

Đối chiếu lần cuối: **24/07/2026**.
