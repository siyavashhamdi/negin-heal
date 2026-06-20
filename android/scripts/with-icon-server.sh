#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${ICON_SERVER_PORT:-18765}"
PID=""

cleanup() {
  if [[ -n "${PID}" ]]; then
    kill "${PID}" 2>/dev/null || true
  fi
}

trap cleanup EXIT

cd "${ROOT_DIR}/store"
python3 -m http.server "${PORT}" >/dev/null 2>&1 &
PID=$!
sleep 1

cd "${ROOT_DIR}"
"$@"
