#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ASSETLINKS_PATH="${ROOT_DIR}/../app/public/.well-known/assetlinks.json"
FINGERPRINT="$("${ROOT_DIR}/scripts/print-fingerprint.sh")"

mkdir -p "$(dirname "${ASSETLINKS_PATH}")"

cat > "${ASSETLINKS_PATH}" <<EOF
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "ir.neginheal.app",
      "sha256_cert_fingerprints": [
        "${FINGERPRINT}"
      ]
    }
  },
  {
    "relation": ["check_validation"],
    "target": {
      "namespace": "cafebazaar_twa",
      "package_name": "ir.neginheal.app"
    }
  }
]
EOF

echo "Updated ${ASSETLINKS_PATH}"
