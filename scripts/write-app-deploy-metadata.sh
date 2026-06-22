#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ROOT_DIR}/app/.env"

set_env_var() {
  local file="$1"
  local key="$2"
  local value="$3"

  if [[ ! -f "$file" ]]; then
    echo "Missing ${file}"
    exit 1
  fi

  if grep -q "^${key}=" "$file"; then
    if [[ "$(uname -s)" == "Darwin" ]]; then
      sed -i '' "s|^${key}=.*|${key}=${value}|" "$file"
    else
      sed -i "s|^${key}=.*|${key}=${value}|" "$file"
    fi
  else
    printf '\n%s=%s\n' "$key" "$value" >>"$file"
  fi
}

deploy_hash="$(git -C "$ROOT_DIR" rev-parse --short=7 HEAD 2>/dev/null || echo "N/A")"

if date --version >/dev/null 2>&1; then
  deploy_datetime="$(date '+%Y-%m-%d, %H:%M:%S').$(date '+%N' | cut -c1-3)"
else
  deploy_datetime="$(date '+%Y-%m-%d, %H:%M:%S').000"
fi

set_env_var "$ENV_FILE" "VITE_DEPLOY_HASH" "$deploy_hash"
set_env_var "$ENV_FILE" "VITE_DEPLOY_DATE_TIME" "$deploy_datetime"

echo "App deploy metadata: hash=${deploy_hash}, deployedAt=${deploy_datetime}"
