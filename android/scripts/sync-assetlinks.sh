#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
FINGERPRINT_FILE="${ROOT_DIR}/.signing-fingerprint"
ASSETLINKS_FILE="${ROOT_DIR}/../app/public/.well-known/assetlinks.json"
PACKAGE_ID="${ANDROID_PACKAGE_ID:-neginheal.app}"

if [[ ! -f "${FINGERPRINT_FILE}" ]]; then
  echo "error: Missing ${FINGERPRINT_FILE}. Run npm run setup:keystore first." >&2
  exit 1
fi

FINGERPRINT="$(tr -d '[:space:]' < "${FINGERPRINT_FILE}")"

python3 - "${ASSETLINKS_FILE}" "${PACKAGE_ID}" "${FINGERPRINT}" <<'PY'
import json
import sys

path, package_id, fingerprint = sys.argv[1:4]
payload = [
    {
        "relation": ["delegate_permission/common.handle_all_urls"],
        "target": {
            "namespace": "android_app",
            "package_name": package_id,
            "sha256_cert_fingerprints": [fingerprint],
        },
    },
    {
        "relation": ["check_validation"],
        "target": {
            "namespace": "cafebazaar_twa",
            "package_name": package_id,
        },
    },
]
with open(path, "w", encoding="utf-8") as handle:
    json.dump(payload, handle, indent=2)
    handle.write("\n")
PY

echo "Updated ${ASSETLINKS_FILE} for ${PACKAGE_ID}"
