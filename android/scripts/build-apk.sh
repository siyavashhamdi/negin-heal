#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
APP_DIR="${ROOT_DIR}/../app"
SDK_DIR="${ANDROID_SDK_ROOT:-${ANDROID_HOME:-$HOME/Library/Android/sdk}}"
APK_SOURCE="${ROOT_DIR}/app/build/outputs/apk/release/app-release.apk"
AAB_SOURCE="${ROOT_DIR}/app/build/outputs/bundle/release/app-release.aab"
PUBLIC_APP_DIR="${APP_DIR}/public/app"
PUBLIC_APK_NAME="negin-heal.apk"
PUBLIC_APK_PATH="${PUBLIC_APP_DIR}/${PUBLIC_APK_NAME}"
MIN_TARGET_SDK=34

printf 'sdk.dir=%s\n' "${SDK_DIR}" > "${ROOT_DIR}/local.properties"

export ANDROID_KEYSTORE_PASSWORD="${ANDROID_KEYSTORE_PASSWORD:-${BUBBLEWRAP_KEYSTORE_PASSWORD:-neginheal}}"
export ANDROID_KEY_PASSWORD="${ANDROID_KEY_PASSWORD:-${BUBBLEWRAP_KEY_PASSWORD:-neginheal}}"

"${ROOT_DIR}/scripts/setup-keystore.sh"

if [[ "${SKIP_KEYSTORE_VERIFY:-0}" != "1" ]]; then
  echo "Verifying production keystore..."
  bash "${ROOT_DIR}/scripts/verify-keystore.sh"
else
  echo "warning: SKIP_KEYSTORE_VERIFY=1 — building with unverified keystore" >&2
fi

echo "Building web app..."
(cd "${APP_DIR}" && npm run build)

echo "Syncing Capacitor Android project..."
(cd "${APP_DIR}" && npx cap sync android)

bash "${ROOT_DIR}/scripts/apply-build-fixes.sh"

if [ -x "${ROOT_DIR}/gradlew" ]; then
  (cd "${ROOT_DIR}" && ./gradlew clean assembleRelease bundleRelease)
else
  echo "error: gradlew is missing or not executable in ${ROOT_DIR}" >&2
  exit 1
fi

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

mkdir -p "${PUBLIC_APP_DIR}"
cp "${APK_SOURCE}" "${PUBLIC_APK_PATH}"
cp "${APK_SOURCE}" "${ROOT_DIR}/app-release-signed.apk"
cp "${AAB_SOURCE}" "${ROOT_DIR}/app-release-bundle.aab"

echo ""
echo "Build complete:"
echo "  APK: ${APK_SOURCE}"
echo "  AAB: ${AAB_SOURCE}"
echo "  Public APK: ${PUBLIC_APK_PATH}"
echo ""
echo "Before Cafe Bazaar upload, run: npm run verify:release"
