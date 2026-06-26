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

# API/frontend builds need ~768MB+ Node heap on small VPS hosts. Set SKIP_APP_BUILD=1
# only if the VPS OOMs and you upload app/dist separately.
SKIP_APP_BUILD="${SKIP_APP_BUILD:-0}"
API_BUILD_HEAP_MB="${API_BUILD_HEAP_MB:-768}"
APP_BUILD_HEAP_MB="${APP_BUILD_HEAP_MB:-768}"
STAGING_DIR="dist.next"

promote_staging_build() {
  local package_dir="$1"
  local marker_file="$2"
  local staging="${package_dir}/${STAGING_DIR}"
  local live="${package_dir}/dist"

  if [[ ! -f "${staging}/${marker_file}" ]]; then
    echo "Build verification failed: ${staging}/${marker_file} is missing."
    exit 1
  fi

  rm -rf "${live}.old"
  if [[ -d "$live" ]]; then
    mv "$live" "${live}.old"
  fi

  mv "$staging" "$live"
  rm -rf "${live}.old"
  echo "Promoted ${staging} -> ${live}"
}

build_api_staging() {
  rm -rf "api/${STAGING_DIR}"
  export NODE_OPTIONS="--max-old-space-size=${API_BUILD_HEAP_MB}"
  npm run build --prefix api -- -p tsconfig.deploy.json
  unset NODE_OPTIONS
  promote_staging_build "api" "main.js"
}

build_app_staging() {
  rm -rf "app/${STAGING_DIR}"

  bash "${ROOT_DIR}/scripts/write-app-deploy-metadata.sh"

  export NODE_OPTIONS="--max-old-space-size=${APP_BUILD_HEAP_MB}"
  npm run build --prefix app -- --outDir "${STAGING_DIR}"
  unset NODE_OPTIONS

  promote_staging_build "app" "index.html"
}

if ! command -v pm2 >/dev/null 2>&1; then
  echo "PM2 is not installed. Install it globally with: npm install -g pm2"
  exit 1
fi

echo "Installing API dependencies..."
npm ci --prefix api

echo "Building API into staging directory (heap limit: ${API_BUILD_HEAP_MB}MB)..."
build_api_staging

if [[ "$SKIP_APP_BUILD" == "1" ]]; then
  echo "Skipping frontend build (using existing app/dist)."
  echo "Installing production app dependencies only..."
  npm ci --prefix app --omit=dev
else
  echo "Installing app dependencies..."
  npm ci --prefix app

  echo "Building app into staging directory (heap limit: ${APP_BUILD_HEAP_MB}MB)..."
  build_app_staging
  npm prune --prefix app --omit=dev
fi

echo "Restarting services with PM2..."
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
