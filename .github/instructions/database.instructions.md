---
applyTo: "src/**/*Migration*.cs,src/**/Persistence/**/*.cs,deploy/postgres/**"
---

# Database Instructions

Treat PostgreSQL as the source of truth. Create a new migration rather than editing a migration already applied to production. Analyze rolling-deploy compatibility, locks, backfill, indexes, and rollback. Never generate conversation sequence with MAX()+1.
