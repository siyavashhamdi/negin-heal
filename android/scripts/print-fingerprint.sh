#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
KEYSTORE="${ROOT_DIR}/android.keystore"
JDK_HOME="${BUBBLEWRAP_JDK_HOME:-$HOME/.bubblewrap/jdk/jdk-17.0.11+9/Contents/Home}"

if [[ ! -f "${KEYSTORE}" ]]; then
  echo "Keystore not found. Run: npm run setup:keystore"
  exit 1
fi

if [[ ! -x "${JDK_HOME}/bin/keytool" ]]; then
  echo "JDK 17 not found at ${JDK_HOME}"
  exit 1
fi

"${JDK_HOME}/bin/keytool" -list -v \
  -keystore "${KEYSTORE}" \
  -alias android \
  -storepass "${BUBBLEWRAP_KEYSTORE_PASSWORD:-neginheal}" \
  | awk '/SHA256:/{print $2; exit}'
