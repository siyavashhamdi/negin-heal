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
LEGACY_PUBLIC_APK_PATH="${PUBLIC_APP_DIR}/negin-heal-no-chrome.apk"
MIN_TARGET_SDK=34
PACKAGE_ID="neginheal.app"
MAIN_ACTIVITY="${PACKAGE_ID}.MainActivity"

printf 'sdk.dir=%s\n' "${SDK_DIR}" > "${ROOT_DIR}/local.properties"

export ANDROID_KEYSTORE_PASSWORD="${ANDROID_KEYSTORE_PASSWORD:-${BUBBLEWRAP_KEYSTORE_PASSWORD:-neginheal}}"
export ANDROID_KEY_PASSWORD="${ANDROID_KEY_PASSWORD:-${BUBBLEWRAP_KEY_PASSWORD:-neginheal}}"

"${ROOT_DIR}/scripts/setup-keystore.sh"

bash "${ROOT_DIR}/scripts/sync-assetlinks.sh"

if [[ "${SKIP_KEYSTORE_VERIFY:-0}" != "1" ]]; then
  echo "Verifying production keystore..."
  bash "${ROOT_DIR}/scripts/verify-keystore.sh"
else
  echo "warning: SKIP_KEYSTORE_VERIFY=1 — building with unverified keystore" >&2
fi

echo "Generating Android launcher icons from app/public/logo.png..."
(cd "${APP_DIR}" && npm run generate:pwa-icons)

# The downloadable APK lives in public/app for the website. Vite copies public/ into
# dist/, so cap sync would embed the previous release APK inside the new one (~50MB+).
APK_STAGING_BACKUP=""
if [[ -f "${PUBLIC_APK_PATH}" ]]; then
  APK_STAGING_BACKUP="$(mktemp)"
  mv "${PUBLIC_APK_PATH}" "${APK_STAGING_BACKUP}"
fi

cleanup_apk_staging_backup() {
  if [[ -n "${APK_STAGING_BACKUP}" && -f "${APK_STAGING_BACKUP}" ]]; then
    rm -f "${APK_STAGING_BACKUP}"
  fi
}
trap cleanup_apk_staging_backup EXIT

echo "Syncing build versions from package.json files..."
node "${ROOT_DIR}/../scripts/generate-build-versions.mjs"

echo "Building web app..."
(cd "${APP_DIR}" && \
  VITE_API_BASE_URL=https://neginheal.ir \
  VITE_APP_URL=https://neginheal.ir \
  npm run build)

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

  LAUNCHABLE_ACTIVITY="$("${AAPT2}" dump badging "${APK_SOURCE}" | sed -n "s/^launchable-activity: name='\\([^']*\\)'.*/\\1/p")"
  if [[ -z "${LAUNCHABLE_ACTIVITY}" ]]; then
    echo "error: Could not read launchable activity from ${APK_SOURCE}" >&2
    exit 1
  fi
  if [[ "${LAUNCHABLE_ACTIVITY}" != "${MAIN_ACTIVITY}" ]]; then
    echo "error: ${APK_SOURCE} is not the Capacitor shell (expected ${MAIN_ACTIVITY}, got ${LAUNCHABLE_ACTIVITY})" >&2
    exit 1
  fi
  echo "Verified Capacitor MainActivity launcher"
fi

if [[ "${SKIP_KEYSTORE_VERIFY:-0}" != "1" ]]; then
  echo "Verifying APK production signature..."
  bash "${ROOT_DIR}/scripts/verify-apk-signature.sh" "${APK_SOURCE}"
else
  echo "warning: SKIP_KEYSTORE_VERIFY=1 — skipping APK signature verification" >&2
fi

mkdir -p "${PUBLIC_APP_DIR}"
rm -f "${LEGACY_PUBLIC_APK_PATH}"
cp -f "${APK_SOURCE}" "${PUBLIC_APK_PATH}"
cp -f "${APK_SOURCE}" "${ROOT_DIR}/app-release-signed.apk"
cp -f "${AAB_SOURCE}" "${ROOT_DIR}/app-release-bundle.aab"

echo "Published web download APK (overwritten): ${PUBLIC_APK_PATH}"

echo ""
echo "Build complete:"
echo "  APK: ${APK_SOURCE}"
echo "  AAB: ${AAB_SOURCE}"
echo "  Public APK: ${PUBLIC_APK_PATH}"
echo ""
echo "Before Cafe Bazaar upload, run: npm run verify:release"
