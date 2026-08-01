.PHONY: validate demo smoke backend worker clients

validate:
	python3 scripts/validate_repository.py

demo:
	node tools/demo-server/server.mjs

smoke:
	bash scripts/smoke_demo.sh

backend:
	dotnet run --project src/RetroMessenger.Api

worker:
	dotnet run --project src/RetroMessenger.Worker

clients:
	cd clients && corepack enable && pnpm install
