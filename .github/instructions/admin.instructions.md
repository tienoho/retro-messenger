---
applyTo: "clients/apps/admin/**"
---

# Admin Instructions

Use admin-specific APIs and enforce least privilege. Frontend permissions only control presentation; the backend must authorize every action. Sensitive actions require reason, scope, confirmation, and audit. Do not implement generic delete for users, rooms, reports, or audit resources.
