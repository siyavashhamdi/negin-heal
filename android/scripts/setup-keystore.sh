#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
KEYSTORE="${ROOT_DIR}/android.keystore"
JDK_HOME="${BUBBLEWRAP_JDK_HOME:-$HOME/.bubblewrap/jdk/jdk-17.0.11+9/Contents/Home}"
STORE_PASS="${BUBBLEWRAP_KEYSTORE_PASSWORD:-neginheal}"
KEY_PASS="${BUBBLEWRAP_KEY_PASSWORD:-neginheal}"

if [[ -f "${KEYSTORE}" ]]; then
  echo "Keystore already exists at ${KEYSTORE}"
  exit 0
fi

if [[ ! -x "${JDK_HOME}/bin/keytool" ]]; then
  echo "JDK 17 not found at ${JDK_HOME}."
  echo "Install Temurin 17 or set BUBBLEWRAP_JDK_HOME."
  exit 1
fi

"${JDK_HOME}/bin/keytool" -genkeypair \
  -alias android \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -storetype PKCS12 \
  -keystore "${KEYSTORE}" \
  -storepass "${STORE_PASS}" \
  -keypass "${KEY_PASS}" \
  -dname "CN=Negin Heal, OU=Mobile, O=Negin Heal, C=IR"

echo "Created ${KEYSTORE}"
