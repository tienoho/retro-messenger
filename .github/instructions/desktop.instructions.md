---
applyTo: "clients/apps/desktop/**"
---

# Desktop Instructions

Preserve Electron main/preload/renderer boundaries. Keep nodeIntegration disabled and contextIsolation enabled. Expose only typed, validated IPC. SQLite and secure credentials belong to the main process or a dedicated worker, not renderer processes.
