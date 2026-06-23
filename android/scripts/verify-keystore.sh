#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
KEYSTORE="${ROOT_DIR}/android.keystore"
FINGERPRINT_FILE="${ROOT_DIR}/.signing-fingerprint"
PACKAGE_ID="${ANDROID_PACKAGE_ID:-neginheal.app}"

if [[ ! -f "${KEYSTORE}" ]]; then
  echo "error: Keystore not found at ${KEYSTORE}" >&2
  echo "Run: FORCE_NEW_KEYSTORE=1 npm run setup:keystore" >&2
  exit 1
fi

if [[ ! -f "${FINGERPRINT_FILE}" ]]; then
  echo "error: Missing ${FINGERPRINT_FILE}" >&2
  echo "Run: npm run setup:keystore" >&2
  exit 1
fi

EXPECTED_FINGERPRINT="$(tr -d '[:space:]' < "${FINGERPRINT_FILE}")"
CURRENT_FINGERPRINT="$(bash "${ROOT_DIR}/scripts/print-fingerprint.sh" | tr -d '[:space:]')"

echo "Package ID: ${PACKAGE_ID}"
echo "Keystore: ${KEYSTORE}"
echo "  current SHA-256:  ${CURRENT_FINGERPRINT}"
echo "  expected SHA-256: ${EXPECTED_FINGERPRINT}"

if [[ "${CURRENT_FINGERPRINT}" != "${EXPECTED_FINGERPRINT}" ]]; then
  echo ""
  echo "error: Keystore fingerprint does not match ${FINGERPRINT_FILE}." >&2
  echo "If you intentionally replaced the keystore, regenerate the fingerprint file:" >&2
  echo "  bash scripts/print-fingerprint.sh > .signing-fingerprint" >&2
  exit 1
fi

echo "  status: PASS"
