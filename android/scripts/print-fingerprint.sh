#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
KEYSTORE="${ROOT_DIR}/android.keystore"
JDK_HOME="${JAVA_HOME:-${BUBBLEWRAP_JDK_HOME:-$HOME/.bubblewrap/jdk/jdk-17.0.11+9/Contents/Home}}"
STORE_PASS="${ANDROID_KEYSTORE_PASSWORD:-${BUBBLEWRAP_KEYSTORE_PASSWORD:-neginheal}}"

if [[ ! -f "${KEYSTORE}" ]]; then
  echo "Keystore not found. Run: npm run setup:keystore" >&2
  exit 1
fi

KEYTOOL="${JDK_HOME}/bin/keytool"
if [[ ! -x "${KEYTOOL}" ]]; then
  KEYTOOL="$(command -v keytool || true)"
fi

if [[ -z "${KEYTOOL}" || ! -x "${KEYTOOL}" ]]; then
  echo "keytool not found. Set JAVA_HOME or BUBBLEWRAP_JDK_HOME." >&2
  exit 1
fi

"${KEYTOOL}" -list -v \
  -keystore "${KEYSTORE}" \
  -alias android \
  -storepass "${STORE_PASS}" \
  | awk '/SHA256:/{print $2; exit}'
