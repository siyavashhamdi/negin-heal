#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
KEYSTORE="${ROOT_DIR}/android.keystore"
EXPECTED_FINGERPRINT="${PRODUCTION_KEYSTORE_FINGERPRINT:-C7:61:73:0B:0E:0F:63:9C:33:71:16:ED:F1:E1:EC:06:E6:94:D7:80:43:E4:A0:4E:BE:AD:CE:09:87:07:26:DF}"

if [[ ! -f "${KEYSTORE}" ]]; then
  echo "error: Keystore not found at ${KEYSTORE}" >&2
  echo "Copy your production android.keystore backup to that path, then rebuild." >&2
  exit 1
fi

CURRENT_FINGERPRINT="$(bash "${ROOT_DIR}/scripts/print-fingerprint.sh")"

echo "Keystore: ${KEYSTORE}"
echo "  current SHA-256:  ${CURRENT_FINGERPRINT}"
echo "  expected SHA-256: ${EXPECTED_FINGERPRINT}"

if [[ "${CURRENT_FINGERPRINT}" != "${EXPECTED_FINGERPRINT}" ]]; then
  echo ""
  echo "error: Keystore fingerprint does not match the production key used for ir.neginheal.app." >&2
  echo "Cafe Bazaar will reject this APK as an update to the existing listing." >&2
  echo ""
  echo "Restore your backed-up production keystore to:" >&2
  echo "  ${KEYSTORE}" >&2
  echo ""
  echo "For local testing only, bypass with:" >&2
  echo "  SKIP_KEYSTORE_VERIFY=1 npm run build" >&2
  exit 1
fi

echo "  status: PASS (production keystore)"
