#!/usr/bin/env bash
set -euo pipefail

ROOT="$(
  cd "$(dirname "${BASH_SOURCE[0]}")/.."
  pwd
)"

PORT="${PORT:-4173}"
LOG="$(mktemp)"

node "$ROOT/tools/demo-server/server.mjs"   >"$LOG" 2>&1 &
PID=$!

cleanup() {
  kill "$PID" 2>/dev/null || true
  rm -f "$LOG"
}
trap cleanup EXIT

for _ in $(seq 1 30); do
  if curl -fsS     "http://127.0.0.1:$PORT/health"     >/dev/null 2>&1; then
    break
  fi
  sleep 0.2
done

HEALTH="$(
  curl -fsS     "http://127.0.0.1:$PORT/health"
)"

CONVERSATIONS="$(
  curl -fsS     "http://127.0.0.1:$PORT/api/v1/conversations"
)"

URL="http://127.0.0.1:$PORT/api/v1/conversations/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/messages"

RESULT="$(
  curl -fsS -X POST     -H 'content-type: application/json'     -d '{"clientMessageId":"smoke-fixed-id","content":"Smoke message"}'     "$URL"
)"

DUPLICATE="$(
  curl -fsS -X POST     -H 'content-type: application/json'     -d '{"clientMessageId":"smoke-fixed-id","content":"Smoke message"}'     "$URL"
)"

python3 -   "$HEALTH"   "$CONVERSATIONS"   "$RESULT"   "$DUPLICATE" <<'PY'
import json
import sys

health, conversations, result, duplicate = map(
    json.loads,
    sys.argv[1:],
)

assert health["status"] == "ok"
assert len(conversations) >= 1
assert result["isDuplicate"] is False
assert duplicate["isDuplicate"] is True

print(
    "PASS: demo health, conversations, "
    "send and idempotent retry."
)
PY
