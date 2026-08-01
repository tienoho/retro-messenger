# Codex Convenience Guide

> Codex uses `AGENTS.md` as the authoritative repository instruction file. This file is a human-facing quick reference and is not a replacement for `AGENTS.md`.

## Startup protocol

1. Read the nearest applicable `AGENTS.md`.
2. Read the workflow suitable for the task.
3. Read the specialist description in `agents/` and its `SKILL.md` when useful.
4. Inspect `git status` and `git diff` before editing.
5. Make focused changes and preserve public contracts unless the task explicitly changes them.

## Completion protocol

- Run relevant build and tests.
- Summarize changed files and decisions.
- State commands actually run.
- State anything not verified.
- Identify migration, contract, security, or rollback impact.
