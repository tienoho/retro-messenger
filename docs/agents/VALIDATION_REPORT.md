# Validation Report

## Scope

- Markdown structure.
- Internal file references.
- Agent-to-skill routing.
- Claude Code adapter structure.
- Gemini CLI adapter structure.
- GitHub Copilot agent and path-instruction structure.
- Cursor rule structure.
- Skill frontmatter and adapter synchronization.

## Findings corrected

1. Root `agents/` files were documentation only and lacked tool-native discovery paths.
2. Root `skills/` files lacked the YAML frontmatter required for Agent Skills discovery.
3. Canonical agents referenced a parent-relative `AGENTS.md` path, which becomes invalid when copied into tool-specific directories.
4. `CLAUDE.md` and `GEMINI.md` asked the model to read other files but did not use their supported import syntax.
5. `CODEX.md` could be misread as an automatically loaded Codex instruction file; Codex uses `AGENTS.md`.
6. Cursor and Copilot lacked scoped rules for backend, database, web, desktop, mobile, and admin code.
7. The pack described multi-agent operation but had no orchestrator agent or explicit routing table.
8. Product specification and code review agents did not have matching reusable skills.

## Automated checks

Run:

```bash
python scripts/generate_tool_adapters.py
python scripts/validate_agent_pack.py
```

Expected result:

```text
PASS: agent pack structure and adapters are consistent.
```

## Remaining limitation

The pack validates instruction structure, not the future application source code. Build commands in `CLAUDE.md` and workflows become executable only after the Retro Messenger solution and `clients/` workspace exist.
