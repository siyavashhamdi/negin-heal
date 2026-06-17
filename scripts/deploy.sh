#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$ROOT_DIR"

if [[ ! -f api/.env ]]; then
  echo "Missing api/.env. Copy api/.env.example and set your production values first."
  exit 1
fi

if [[ ! -f app/.env ]]; then
  echo "Missing app/.env. Copy app/.env.example and set your production values first."
  exit 1
fi

# The frontend build needs ~768MB+ Node heap. On a 1GB VPS it will OOM.
# Default: never build the app on the server — upload app/dist from your machine.
# To force an on-server build (only on machines with enough RAM):
#   BUILD_APP_ON_SERVER=1 npm run deploy
SKIP_APP_BUILD="${SKIP_APP_BUILD:-1}"
APP_BUILD_HEAP_MB="${APP_BUILD_HEAP_MB:-768}"

if [[ "${BUILD_APP_ON_SERVER:-0}" == "1" ]]; then
  SKIP_APP_BUILD=0
fi

if [[ "$SKIP_APP_BUILD" == "1" ]]; then
  if [[ ! -f app/dist/index.html ]]; then
    echo "app/dist is missing. Build the frontend on your machine and upload it first:"
    echo
    echo "  DEPLOY_HOST=root@your-server npm run publish:app"
    echo
    echo "Or manually:"
    echo "  npm run build:app"
    echo "  rsync -avz --delete app/dist/ root@your-server:/siya/negin-heal/app/dist/"
    echo "  ssh root@your-server 'cd /siya/negin-heal && npm run deploy'"
    exit 1
  fi
  echo "Using uploaded app/dist (skipping frontend build on server)."
fi

echo "Stopping PM2 processes to free memory..."
pm2 stop ecosystem.config.cjs 2>/dev/null || true

echo "Installing API dependencies..."
npm ci --prefix api

echo "Building API..."
npm run build --prefix api

if [[ "$SKIP_APP_BUILD" == "1" ]]; then
  echo "Installing production app dependencies only..."
  npm ci --prefix app --omit=dev
else
  echo "Installing app dependencies..."
  npm ci --prefix app

  echo "Building app on server (heap limit: ${APP_BUILD_HEAP_MB}MB)..."
  export NODE_OPTIONS="--max-old-space-size=${APP_BUILD_HEAP_MB}"
  npm run build --prefix app
  npm prune --prefix app --omit=dev
  unset NODE_OPTIONS
fi

if ! command -v pm2 >/dev/null 2>&1; then
  echo "PM2 is not installed. Install it globally with: npm install -g pm2"
  exit 1
fi

echo "Starting services with PM2..."
pm2 restart ecosystem.config.cjs 2>/dev/null || pm2 start ecosystem.config.cjs
pm2 save

echo
echo "Deployment complete."
echo "App: http://0.0.0.0:5700"
echo "API: http://0.0.0.0:5701"
echo
echo "Useful commands:"
echo "  pm2 status"
echo "  pm2 logs"
echo "  npm run stop"
