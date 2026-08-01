# Claude Code Project Context

@AGENTS.md
@docs/PROJECT_CONTEXT.md
@docs/AGENT_ROUTING.md

## Claude Code usage

- Project subagents are in `.claude/agents/`.
- Project skills are in `.claude/skills/`.
- Run `/agents` to inspect agents after restarting the session.
- Invoke a skill with `/skill-name` or allow Claude to activate it when relevant.
- Keep permissions conservative; reviewers should remain read-only.

## Verification commands

```bash
dotnet restore
dotnet build
dotnet test

cd clients
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```
