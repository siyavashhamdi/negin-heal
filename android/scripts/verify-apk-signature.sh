#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SDK_DIR="${ANDROID_SDK_ROOT:-${ANDROID_HOME:-$HOME/Library/Android/sdk}}"
APK="${1:-}"
FINGERPRINT_FILE="${ROOT_DIR}/.signing-fingerprint"
PACKAGE_ID="${ANDROID_PACKAGE_ID:-neginheal.app}"

if [[ -z "${APK}" ]]; then
  echo "usage: $0 <path-to.apk>" >&2
  exit 1
fi

if [[ ! -f "${APK}" ]]; then
  echo "error: APK not found: ${APK}" >&2
  exit 1
fi

if [[ ! -f "${FINGERPRINT_FILE}" ]]; then
  echo "error: Missing ${FINGERPRINT_FILE}" >&2
  exit 1
fi

EXPECTED_NORMALIZED="$(tr '[:upper:]' '[:lower:]' < "${FINGERPRINT_FILE}" | tr -d '[:space:]' | tr -d ':')"

APKSIGNER="$(find "${SDK_DIR}/build-tools" -name apksigner 2>/dev/null | sort -V | tail -1)"
if [[ -z "${APKSIGNER}" ]]; then
  echo "error: apksigner not found under ${SDK_DIR}/build-tools" >&2
  exit 1
fi

CURRENT_NORMALIZED="$("${APKSIGNER}" verify --print-certs "${APK}" 2>/dev/null \
  | sed -n 's/^Signer #1 certificate SHA-256 digest: //p' \
  | head -1 \
  | tr '[:upper:]' '[:lower:]' \
  | tr -d ':')"

if [[ -z "${CURRENT_NORMALIZED}" ]]; then
  echo "error: Could not read APK signing certificate from ${APK}" >&2
  exit 1
fi

CURRENT_FORMATTED="$(printf '%s' "${CURRENT_NORMALIZED}" | sed -E 's/(..)/\1:/g; s/:$//')"
EXPECTED_FORMATTED="$(printf '%s' "${EXPECTED_NORMALIZED}" | sed -E 's/(..)/\1:/g; s/:$//')"

echo "Package ID: ${PACKAGE_ID}"
echo "APK: ${APK}"
echo "  certificate SHA-256: ${CURRENT_FORMATTED}"
echo "  expected SHA-256:    ${EXPECTED_FORMATTED}"

if [[ "${CURRENT_NORMALIZED}" != "${EXPECTED_NORMALIZED}" ]]; then
  echo ""
  echo "error: APK signature does not match ${FINGERPRINT_FILE}." >&2
  exit 1
fi

echo "  status: PASS"
