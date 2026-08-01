# Validation Reports

Repository có hai lớp kiểm định độc lập:

- [Repository validation](repository/VALIDATION_REPORT.md): cấu trúc source code, JSON/YAML/XML, demo, manifest và ZIP.
- [Agent Pack validation](agent-pack/VALIDATION_REPORT.md): agent, skill, workflow, adapter Claude/Gemini/Copilot/Cursor và liên kết nội bộ.

Cả hai validator phải chạy thành công trước khi phát hành ZIP:

```bash
python3 scripts/validate_repository.py
python3 scripts/validate_agent_pack.py
bash scripts/smoke_demo.sh
```
