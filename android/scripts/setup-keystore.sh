#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
KEYSTORE="${ROOT_DIR}/android.keystore"
FINGERPRINT_FILE="${ROOT_DIR}/.signing-fingerprint"
BACKUP_DIR="${HOME}/secure-backups/negin-heal"
JDK_HOME="${BUBBLEWRAP_JDK_HOME:-$HOME/.bubblewrap/jdk/jdk-17.0.11+9/Contents/Home}"
STORE_PASS="${BUBBLEWRAP_KEYSTORE_PASSWORD:-neginheal}"
KEY_PASS="${BUBBLEWRAP_KEY_PASSWORD:-neginheal}"

write_fingerprint_file() {
  bash "${ROOT_DIR}/scripts/print-fingerprint.sh" > "${FINGERPRINT_FILE}"
  echo "Recorded signing fingerprint in ${FINGERPRINT_FILE}"
}

backup_keystore() {
  mkdir -p "${BACKUP_DIR}"
  local backup_path="${BACKUP_DIR}/android-$(date +%Y%m%d-%H%M%S).keystore"
  cp "${KEYSTORE}" "${backup_path}"
  echo "Backed up keystore to ${backup_path}"
}

if [[ "${FORCE_NEW_KEYSTORE:-0}" == "1" && -f "${KEYSTORE}" ]]; then
  echo "Removing existing keystore (FORCE_NEW_KEYSTORE=1)..."
  rm -f "${KEYSTORE}"
fi

if [[ -f "${KEYSTORE}" ]]; then
  echo "Keystore already exists at ${KEYSTORE}"
  if [[ ! -f "${FINGERPRINT_FILE}" ]]; then
    write_fingerprint_file
  fi
  bash "${ROOT_DIR}/scripts/print-fingerprint.sh" || true
  exit 0
fi

echo "Creating new signing keystore for neginheal.app..."

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
backup_keystore
write_fingerprint_file
