#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path
import json
import os
import subprocess
import sys
import xml.etree.ElementTree as ET

import yaml

root = Path(__file__).resolve().parents[1]
errors: list[str] = []

required = [
    "AGENTS.md",
    "README.md",
    "CONTRIBUTING.md",
    "SECURITY.md",
    "CHANGELOG.md",
    "RetroMessenger.slnx",
    "docker-compose.yml",
    "docs/PROJECT_CONTEXT.md",
    "docs/AGENT_ROUTING.md",
    "docs/TOOL_COMPATIBILITY.md",
    "src/RetroMessenger.Api/Program.cs",
    "src/RetroMessenger.Api/Middleware/GlobalExceptionHandler.cs",
    "src/RetroMessenger.Domain/Messaging/Message.cs",
    "clients/package.json",
    "clients/apps/web/src/App.tsx",
    "clients/apps/desktop/src/main/index.ts",
    "clients/apps/mobile/app/index.tsx",
    "clients/apps/admin/src/App.tsx",
    "clients/packages/realtime-contracts/src/index.ts",
    "clients/packages/auth-core/src/index.ts",
    "clients/packages/web-ui/src/index.tsx",
    "clients/packages/mobile-ui/src/index.tsx",
    "tools/demo-server/server.mjs",
    "deploy/postgres/migrations/001_initial.sql",
]

for rel in required:
    if not (root / rel).is_file():
        errors.append(f"Missing required file: {rel}")

def walk_repo_files(ext: str | None = None) -> list[Path]:
    res = []
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [
            d
            for d in dirnames
            if d
            not in [
                "node_modules",
                ".git",
                "bin",
                "obj",
                "__pycache__",
                ".turbo",
                ".agents",
                ".expo",
            ]
        ]
        for f in filenames:
            if f.endswith(".pyc"):
                continue
            if ext is None or f.endswith(ext):
                res.append(Path(dirpath) / f)
    return res

for path in walk_repo_files():
    if path.stat().st_size == 0:
        errors.append(f"Empty file: {path.relative_to(root)}")

json_files = walk_repo_files("package.json") + [
    root / "global.json",
    root / "clients/turbo.json",
    root / "clients/apps/mobile/app.json",
    root / "clients/apps/mobile/eas.json",
]
for path in json_files:
    try:
        json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        errors.append(f"Invalid JSON {path.relative_to(root)}: {exc}")

for path in [
    root / "docker-compose.yml",
    root / "deploy/livekit/livekit.yaml",
    *root.glob(".github/**/*.yml"),
]:
    try:
        yaml.safe_load(path.read_text(encoding="utf-8"))
    except Exception as exc:
        errors.append(f"Invalid YAML {path.relative_to(root)}: {exc}")

for path in [
    root / "RetroMessenger.slnx",
    root / "Directory.Build.props",
    root / "Directory.Packages.props",
    *walk_repo_files(".csproj"),
]:
    try:
        ET.parse(path)
    except Exception as exc:
        errors.append(f"Invalid XML {path.relative_to(root)}: {exc}")

# Validate solution and project references.
sln = ET.parse(root / "RetroMessenger.slnx").getroot()
for project in sln.iter("Project"):
    rel = project.attrib.get("Path", "")
    if rel and not (root / rel).is_file():
        errors.append(f"Missing solution project: {rel}")

for csproj in walk_repo_files(".csproj"):
    tree = ET.parse(csproj).getroot()
    for ref in tree.iter("ProjectReference"):
        include = ref.attrib.get("Include", "")
        target = (csproj.parent / include).resolve()
        if not target.is_file():
            errors.append(
                f"Missing ProjectReference from {csproj.relative_to(root)}: {include}")

expected_directories = [
    "src/RetroMessenger.Domain/Identity",
    "src/RetroMessenger.Domain/Contacts",
    "src/RetroMessenger.Domain/Presence",
    "src/RetroMessenger.Domain/Rooms",
    "src/RetroMessenger.Domain/Media",
    "src/RetroMessenger.Domain/Calls",
    "src/RetroMessenger.Domain/Notifications",
    "src/RetroMessenger.Domain/Moderation",
    "src/RetroMessenger.Application/Behaviors",
    "src/RetroMessenger.Infrastructure/Authentication",
    "src/RetroMessenger.Infrastructure/Redis",
    "src/RetroMessenger.Infrastructure/Storage",
    "src/RetroMessenger.Infrastructure/PushNotifications",
    "src/RetroMessenger.Infrastructure/LiveKit",
    "clients/apps/web/src/features/sync",
    "clients/apps/desktop/src/main/ipc",
    "clients/apps/mobile/src/features/push-notifications",
    "clients/apps/admin/src/resources/audit-logs",
    "clients/packages/realtime-contracts",
    "clients/packages/auth-core",
    "clients/packages/web-ui",
    "clients/packages/mobile-ui",
    "clients/packages/config",
    "clients/packages/logger",
    "clients/packages/eslint-config",
    "clients/packages/typescript-config",
]
for rel in expected_directories:
    directory = root / rel
    if not directory.is_dir():
        errors.append(f"Missing required directory: {rel}")
    elif not any(path.is_file() for path in directory.rglob("*")):
        errors.append(f"Required directory has no content: {rel}")

# Validate workspace local dependencies.
package_by_name: dict[str, Path] = {}
package_data: dict[Path, dict] = {}
for manifest in walk_repo_files("package.json"):
    if "node_modules" in manifest.parts:
        continue
    data = json.loads(manifest.read_text(encoding="utf-8"))
    package_data[manifest] = data
    name = data.get("name")
    if name:
        if name in package_by_name:
            errors.append(f"Duplicate package name: {name}")
        package_by_name[name] = manifest

for manifest, data in package_data.items():
    for section in ["dependencies", "devDependencies", "peerDependencies"]:
        for name, version in data.get(section, {}).items():
            if isinstance(version, str) and version.startswith("workspace:"):
                if name not in package_by_name:
                    errors.append(
                        f"Unresolved workspace dependency {name} in {manifest.relative_to(root)}")

# Markdown integrity.
for path in walk_repo_files(".md"):
    text = path.read_text(encoding="utf-8")
    if text.count("```") % 2:
        errors.append(f"Unclosed Markdown fence: {path.relative_to(root)}")
    stripped = text.lstrip()
    if not stripped.startswith(("#", "---", "@")):
        errors.append(f"Markdown missing heading/frontmatter: {path.relative_to(root)}")

# Ensure agent pack validator succeeds.
agent_check = subprocess.run(
    [sys.executable, str(root / "scripts/validate_agent_pack.py")],
    cwd=root,
    text=True,
    capture_output=True,
)
if agent_check.returncode != 0:
    errors.append("Agent pack validation failed:\n" + agent_check.stdout + agent_check.stderr)

# Validate manifest exactly, ignoring the manifest's self entry.
manifest_path = root / "PROJECT_MANIFEST.md"
manifest_text = manifest_path.read_text(encoding="utf-8")
listed = {
    line[3:-1]
    for line in manifest_text.splitlines()
    if line.startswith("- `") and line.endswith("`")
}
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
            ".expo",
        ]
    ]
    for f in filenames:
        if f.endswith((".pyc", ".tsbuildinfo")) or f == "PROJECT_MANIFEST.md":
            continue
        rel = os.path.relpath(os.path.join(dirpath, f), root).replace("\\", "/")
        actual.add(rel)
if listed != actual:
    missing = sorted(actual - listed)
    stale = sorted(listed - actual)
    if missing:
        errors.append("Manifest missing entries: " + ", ".join(missing[:20]))
    if stale:
        errors.append("Manifest stale entries: " + ", ".join(stale[:20]))

# Targeted regression guards.
worker_docker = (root / "src/RetroMessenger.Worker/Dockerfile").read_text(encoding="utf-8")
if "dotnet/aspnet:10.0" not in worker_docker:
    errors.append("Worker runtime image must include Microsoft.AspNetCore.App.")

desktop = json.loads((root / "clients/apps/desktop/package.json").read_text(encoding="utf-8"))
if desktop.get("main") != "out/main/index.js":
    errors.append("Electron main output path must match electron-vite default output.")

babel = (root / "clients/apps/mobile/babel.config.js").read_text(encoding="utf-8")
if "expo-router/babel" in babel:
    errors.append("Deprecated expo-router/babel plugin is still configured.")

if errors:
    print("\n".join(f"ERROR: {item}" for item in errors))
    sys.exit(1)

counts = {
    "files": len(walk_repo_files()),
    "markdown": len(walk_repo_files(".md")),
    "csharp": len(walk_repo_files(".cs")),
    "typescript": len(walk_repo_files(".ts")) + len(walk_repo_files(".tsx")),
    "packages": len(package_by_name),
}

print("PASS: repository structure, references, manifests and agent adapters are consistent.")
print(json.dumps(counts, indent=2))
