#!/usr/bin/env python3
"""Generate Claude, Gemini, and GitHub Copilot agent adapters and skill copies."""
from pathlib import Path
import json
import shutil

ROOT = Path(__file__).resolve().parents[1]
REGISTRY = json.loads((ROOT / "agents/registry.json").read_text(encoding="utf-8"))

for rel in [".claude/agents", ".claude/skills", ".gemini/agents", ".agents/skills", ".github/agents"]:
    path = ROOT / rel
    if path.exists():
        shutil.rmtree(path)
    path.mkdir(parents=True, exist_ok=True)

for name, meta in REGISTRY.items():
    canonical = (ROOT / "agents" / meta["file"]).read_text(encoding="utf-8").strip()
    lines = canonical.splitlines()
    if lines and lines[0].startswith("# "):
        lines = lines[1:]
    body = "\n".join(lines).strip().replace("Đọc `AGENTS.md` trước khi thực hiện task.\n\n", "")
    marker = f'<!-- GENERATED FROM agents/{meta["file"]}; DO NOT EDIT DIRECTLY -->\n\n'
    body = marker + f'Tuân thủ `AGENTS.md` và `docs/PROJECT_CONTEXT.md`. Khi cần quy trình chi tiết, sử dụng skill `{meta["skill"]}`.\n\n' + body

    claude_tools = "Read, Glob, Grep" if meta["mode"] == "read" else "Read, Glob, Grep, Edit, Write, Bash"
    claude = (
        f'---\nname: {name}\ndescription: {meta["description"]}\n'
        f'tools: {claude_tools}\nmodel: inherit\nskills:\n  - {meta["skill"]}\n---\n\n{body}\n'
    )
    (ROOT / ".claude/agents" / f"{name}.md").write_text(claude, encoding="utf-8")

    gemini = ["---", f"name: {name}", f"description: {meta['description']}", "kind: local"]
    if meta["mode"] == "read":
        gemini += ["tools:", "  - read_file", "  - glob", "  - grep_search", "  - list_directory", "  - activate_skill"]
    gemini += ["model: inherit", "max_turns: 30", "---", "", body, ""]
    (ROOT / ".gemini/agents" / f"{name}.md").write_text("\n".join(gemini), encoding="utf-8")

    copilot = ["---", f"name: {name}", f"description: {meta['description']}"]
    if meta["mode"] == "read":
        copilot += ["tools:", "  - read", "  - search"]
    copilot += ["---", "", body, ""]
    (ROOT / ".github/agents" / f"{name}.agent.md").write_text("\n".join(copilot), encoding="utf-8")

for skill_dir in sorted((ROOT / "skills").iterdir()):
    source = skill_dir / "SKILL.md"
    if not source.exists():
        continue
    for target_root in [ROOT / ".claude/skills", ROOT / ".agents/skills"]:
        target = target_root / skill_dir.name
        target.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, target / "SKILL.md")

print(f"Generated adapters for {len(REGISTRY)} agents.")
