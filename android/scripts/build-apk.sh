#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "${ROOT_DIR}"

SDK_DIR="${ANDROID_SDK_ROOT:-${ANDROID_HOME:-$HOME/Library/Android/sdk}}"
printf 'sdk.dir=%s\n' "${SDK_DIR}" > "${ROOT_DIR}/local.properties"

export BUBBLEWRAP_KEYSTORE_PASSWORD="${BUBBLEWRAP_KEYSTORE_PASSWORD:-neginheal}"
export BUBBLEWRAP_KEY_PASSWORD="${BUBBLEWRAP_KEY_PASSWORD:-neginheal}"

"${ROOT_DIR}/scripts/setup-keystore.sh"
"${ROOT_DIR}/scripts/sync-assetlinks.sh"
"${ROOT_DIR}/scripts/with-icon-server.sh" npx bubblewrap update --skipVersionUpgrade
bash "${ROOT_DIR}/scripts/apply-build-fixes.sh"

if [ -x "${ROOT_DIR}/gradlew" ]; then
  (cd "${ROOT_DIR}" && ./gradlew clean)
fi

npx bubblewrap build --skipPwaValidation

APK_SOURCE="${ROOT_DIR}/app-release-signed.apk"
MIN_TARGET_SDK=34
AAPT2="$(find "${SDK_DIR}/build-tools" -name aapt2 2>/dev/null | sort -V | tail -1)"
if [ -z "${AAPT2}" ]; then
  echo "warning: aapt2 not found; skipping targetSdk verification" >&2
else
  TARGET_SDK="$("${AAPT2}" dump badging "${APK_SOURCE}" | sed -n "s/.*targetSdkVersion:'\\([0-9]*\\)'.*/\\1/p")"
  if [ -z "${TARGET_SDK}" ] || [ "${TARGET_SDK}" -lt "${MIN_TARGET_SDK}" ]; then
    echo "error: ${APK_SOURCE} has targetSdkVersion ${TARGET_SDK:-unknown}; expected >= ${MIN_TARGET_SDK}" >&2
    exit 1
  fi
  echo "Verified targetSdkVersion ${TARGET_SDK} (required >= ${MIN_TARGET_SDK})"
fi
PUBLIC_APP_DIR="${ROOT_DIR}/../app/public/app"
PUBLIC_APK_NAME="negin-heal.apk"
PUBLIC_APK_PATH="${PUBLIC_APP_DIR}/${PUBLIC_APK_NAME}"

mkdir -p "${PUBLIC_APP_DIR}"
cp "${APK_SOURCE}" "${PUBLIC_APK_PATH}"

echo ""
echo "Build complete:"
echo "  APK: ${APK_SOURCE}"
echo "  AAB: ${ROOT_DIR}/app-release-bundle.aab"
echo "  Public APK: ${PUBLIC_APK_PATH}"
