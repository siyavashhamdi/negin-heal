#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

"${ROOT_DIR}/scripts/with-icon-server.sh" npx bubblewrap update --skipVersionUpgrade
bash "${ROOT_DIR}/scripts/apply-build-fixes.sh"

echo "Android project updated."
