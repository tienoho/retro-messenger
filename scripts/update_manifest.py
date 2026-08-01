#!/usr/bin/env python3
import os
from pathlib import Path

root = Path(__file__).resolve().parents[1]
actual = set()
for dirpath, dirnames, filenames in os.walk(root):
    dirnames[:] = [
        d
        for d in dirnames
        if d
        not in [
            "node_modules",
            "bin",
            "obj",
            "dist",
            "out",
            "release",
            ".git",
            "__pycache__",
            ".turbo",
            ".agents",
        ]
    ]
    for f in filenames:
        if f.endswith((".pyc", ".tsbuildinfo")) or f == "PROJECT_MANIFEST.md":
            continue
        rel = os.path.relpath(os.path.join(dirpath, f), root).replace("\\", "/")
        actual.add(rel)

manifest_path = root / "PROJECT_MANIFEST.md"
lines = ["# Project Manifest", ""]
for f in sorted(actual):
    lines.append(f"- `{f}`")

manifest_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
print(f"Updated {manifest_path} with {len(actual)} entries.")
