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

echo "Installing dependencies..."
npm install --prefix api
npm install --prefix app

echo "Building API and app..."
npm run build --prefix api
npm run build --prefix app

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
