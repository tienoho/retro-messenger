#!/usr/bin/env python3
"""Validate structure, Markdown, frontmatter, adapters, and internal references."""
from pathlib import Path
import json
import re
import sys

import os

ROOT = Path(__file__).resolve().parents[1]
REGISTRY = json.loads((ROOT / "agents/registry.json").read_text(encoding="utf-8"))
ERRORS: list[str] = []
WARNINGS: list[str] = []


def walk_markdown_files() -> list[Path]:
    res = []
    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = [d for d in dirnames if d not in ["node_modules", ".git", "bin", "obj", "__pycache__", ".turbo"]]
        for f in filenames:
            if f.endswith(".md"):
                res.append(Path(dirpath) / f)
    return res


def parse_frontmatter(path: Path) -> tuple[dict[str, object], str]:
    text = path.read_text(encoding="utf-8")
    if not text.startswith("---\n"):
        return {}, text
    end = text.find("\n---\n", 4)
    if end < 0:
        ERRORS.append(f"{path.relative_to(ROOT)}: unclosed YAML frontmatter")
        return {}, text
    raw = text[4:end]
    body = text[end + 5:]
    data: dict[str, object] = {}
    current_list: str | None = None
    for line in raw.splitlines():
        if line.startswith("  - ") and current_list:
            data.setdefault(current_list, [])
            assert isinstance(data[current_list], list)
            data[current_list].append(line[4:].strip())
            continue
        if ":" not in line:
            continue
        key, value = line.split(":", 1)
        key, value = key.strip(), value.strip()
        if value == "":
            data[key] = []
            current_list = key
        else:
            data[key] = value.strip('"')
            current_list = None
    return data, body


# Markdown structural checks.
for path in walk_markdown_files():
    text = path.read_text(encoding="utf-8")
    rel = path.relative_to(ROOT)
    if not text.endswith("\n"):
        ERRORS.append(f"{rel}: missing final newline")
    if len(re.findall(r"^```", text, flags=re.MULTILINE)) % 2:
        ERRORS.append(f"{rel}: unbalanced code fences")
    headings = [len(m.group(1)) for m in re.finditer(r"^(#{1,6})\s+", text, flags=re.MULTILINE)]
    if not headings:
        WARNINGS.append(f"{rel}: no Markdown heading")
    for left, right in zip(headings, headings[1:]):
        if right > left + 1:
            ERRORS.append(f"{rel}: heading level jumps H{left} to H{right}")
            break

# Registry sanity.
if len(REGISTRY) != len(set(REGISTRY)):
    ERRORS.append("Duplicate agent names in registry")
files = [meta["file"] for meta in REGISTRY.values()]
if len(files) != len(set(files)):
    ERRORS.append("Duplicate canonical agent files in registry")

# Required roots.
for rel in [
    "AGENTS.md", "CLAUDE.md", "GEMINI.md", ".github/copilot-instructions.md",
    "docs/PROJECT_CONTEXT.md", "docs/AGENT_ROUTING.md", "docs/TOOL_COMPATIBILITY.md"
]:
    if not (ROOT / rel).exists():
        ERRORS.append(f"Missing required file: {rel}")

# Canonical and adapter agents.
for name, meta in REGISTRY.items():
    canonical = ROOT / "agents" / meta["file"]
    if not canonical.exists():
        ERRORS.append(f"Missing canonical agent: {canonical.relative_to(ROOT)}")
    targets = [
        ROOT / ".claude/agents" / f"{name}.md",
        ROOT / ".gemini/agents" / f"{name}.md",
        ROOT / ".github/agents" / f"{name}.agent.md",
    ]
    for target in targets:
        if not target.exists():
            ERRORS.append(f"Missing adapter: {target.relative_to(ROOT)}")
            continue
        fm, body = parse_frontmatter(target)
        for required in ["name", "description"]:
            if not fm.get(required):
                ERRORS.append(f"{target.relative_to(ROOT)}: missing frontmatter {required}")
        if fm.get("name") != name:
            ERRORS.append(f"{target.relative_to(ROOT)}: name mismatch")
        if not body.strip():
            ERRORS.append(f"{target.relative_to(ROOT)}: empty prompt body")
        marker = f"<!-- GENERATED FROM agents/{meta['file']}; DO NOT EDIT DIRECTLY -->"
        if marker not in body:
            ERRORS.append(f"{target.relative_to(ROOT)}: missing generated-source marker")

# Canonical and copied skills.
skill_names: set[str] = set()
for skill_dir in (ROOT / "skills").iterdir():
    path = skill_dir / "SKILL.md"
    if not path.exists():
        continue
    skill_names.add(skill_dir.name)
    fm, body = parse_frontmatter(path)
    if fm.get("name") != skill_dir.name:
        ERRORS.append(f"{path.relative_to(ROOT)}: skill name must match directory")
    if not fm.get("description"):
        ERRORS.append(f"{path.relative_to(ROOT)}: missing skill description")
    if not body.strip():
        ERRORS.append(f"{path.relative_to(ROOT)}: empty skill body")
    for copy_root in [ROOT / ".claude/skills", ROOT / ".agents/skills"]:
        copy = copy_root / skill_dir.name / "SKILL.md"
        if not copy.exists():
            ERRORS.append(f"Missing skill adapter: {copy.relative_to(ROOT)}")
        elif copy.read_bytes() != path.read_bytes():
            ERRORS.append(f"Out-of-sync skill adapter: {copy.relative_to(ROOT)}")

for name, meta in REGISTRY.items():
    if meta["skill"] not in skill_names:
        ERRORS.append(f"Agent {name} references missing skill {meta['skill']}")

# AGENTS.md referenced local backtick paths.
text = (ROOT / "AGENTS.md").read_text(encoding="utf-8")
for ref in re.findall(r"`([^`\n]+)`", text):
    if "/" not in ref or ref.startswith(("/", "http", "api/")) or " " in ref:
        continue
    candidate = ROOT / ref
    if not candidate.exists():
        ERRORS.append(f"AGENTS.md references missing path: {ref}")

# GitHub path-specific instructions.
for path in (ROOT / ".github/instructions").glob("*.instructions.md"):
    fm, body = parse_frontmatter(path)
    if not fm.get("applyTo"):
        ERRORS.append(f"{path.relative_to(ROOT)}: missing applyTo frontmatter")
    if not body.lstrip().startswith("# "):
        ERRORS.append(f"{path.relative_to(ROOT)}: missing H1 after frontmatter")

# Cursor MDC rules.
for path in (ROOT / ".cursor/rules").glob("*.mdc"):
    fm, body = parse_frontmatter(path)
    for required in ["description", "globs", "alwaysApply"]:
        if required not in fm:
            ERRORS.append(f"{path.relative_to(ROOT)}: missing frontmatter {required}")
    if not body.strip():
        ERRORS.append(f"{path.relative_to(ROOT)}: empty rule body")

# Context imports and stale relative references.
for rel in ["CLAUDE.md", "GEMINI.md"]:
    text = (ROOT / rel).read_text(encoding="utf-8")
    for required in ["@AGENTS.md", "@docs/PROJECT_CONTEXT.md", "@docs/AGENT_ROUTING.md"]:
        if required not in text:
            ERRORS.append(f"{rel}: missing context import {required}")
for path in walk_markdown_files():
    if "../AGENTS.md" in path.read_text(encoding="utf-8"):
        ERRORS.append(f"{path.relative_to(ROOT)}: stale ../AGENTS.md reference")

print(f"Validated {len(walk_markdown_files())} Markdown files, {len(REGISTRY)} agents, and {len(skill_names)} skills.")
for warning in WARNINGS:
    print(f"WARNING: {warning}")
for error in ERRORS:
    print(f"ERROR: {error}")
if ERRORS:
    sys.exit(1)
print("PASS: agent pack structure and adapters are consistent.")
