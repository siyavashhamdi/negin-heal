#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

DEPLOY_HOST="${DEPLOY_HOST:-}"
DEPLOY_PATH="${DEPLOY_PATH:-/siya/negin-heal}"

echo "Writing app deploy metadata..."
bash "${ROOT_DIR}/scripts/write-app-deploy-metadata.sh"

echo "Building frontend..."
npm run build:app

if [[ -z "$DEPLOY_HOST" ]]; then
  echo
  echo "Frontend built at app/dist"
  echo "Upload to the server, then deploy:"
  echo "  rsync -avz --delete app/dist/ USER@SERVER:${DEPLOY_PATH}/app/dist/"
  echo "  ssh USER@SERVER 'cd ${DEPLOY_PATH} && npm run deploy'"
  echo
  echo "Or set DEPLOY_HOST to upload automatically:"
  echo "  DEPLOY_HOST=user@your-server npm run publish:app"
  exit 0
fi

echo "Uploading app/dist to ${DEPLOY_HOST}:${DEPLOY_PATH}/app/dist ..."
rsync -avz --delete "${ROOT_DIR}/app/dist/" "${DEPLOY_HOST}:${DEPLOY_PATH}/app/dist/"

echo "Running deploy on server (API only, no frontend build)..."
ssh "${DEPLOY_HOST}" "cd ${DEPLOY_PATH} && npm run deploy"

echo "Done."
