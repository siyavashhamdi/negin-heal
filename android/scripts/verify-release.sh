#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SDK_DIR="${ANDROID_SDK_ROOT:-${ANDROID_HOME:-$HOME/Library/Android/sdk}}"
MIN_TARGET_SDK="${MIN_TARGET_SDK:-34}"
EXPECTED_TARGET_SDK="${EXPECTED_TARGET_SDK:-35}"
APK="${1:-${ROOT_DIR}/app-release-signed.apk}"
AAB="${2:-${ROOT_DIR}/app-release-bundle.aab}"

AAPT2="$(find "${SDK_DIR}/build-tools" -name aapt2 2>/dev/null | sort -V | tail -1)"
if [ -z "${AAPT2}" ]; then
  echo "error: aapt2 not found under ${SDK_DIR}/build-tools" >&2
  exit 1
fi

fail() {
  echo "error: $1" >&2
  exit 1
}

check_apk() {
  local file="$1"
  [ -f "${file}" ] || fail "APK not found: ${file}"

  local badging target_sdk version_code version_name compile_sdk
  badging="$("${AAPT2}" dump badging "${file}")"
  target_sdk="$(printf '%s\n' "${badging}" | sed -n "s/.*targetSdkVersion:'\\([0-9]*\\)'.*/\\1/p")"
  version_code="$(printf '%s\n' "${badging}" | sed -n "s/.*versionCode='\\([0-9]*\\)'.*/\\1/p")"
  version_name="$(printf '%s\n' "${badging}" | sed -n "s/.*versionName='\\([^']*\\)'.*/\\1/p")"
  compile_sdk="$(printf '%s\n' "${badging}" | sed -n "s/.*compileSdkVersion='\\([0-9]*\\)'.*/\\1/p")"

  echo "APK: ${file}"
  echo "  versionCode: ${version_code}"
  echo "  versionName: ${version_name}"
  echo "  compileSdkVersion: ${compile_sdk}"
  echo "  targetSdkVersion: ${target_sdk}"

  [ -n "${target_sdk}" ] || fail "Could not read targetSdkVersion from ${file}"
  [ "${target_sdk}" -ge "${MIN_TARGET_SDK}" ] || fail "targetSdkVersion ${target_sdk} < required ${MIN_TARGET_SDK}"
  [ "${target_sdk}" -eq "${EXPECTED_TARGET_SDK}" ] || fail "targetSdkVersion ${target_sdk} != expected ${EXPECTED_TARGET_SDK}"
  [ "${compile_sdk}" -ge "${MIN_TARGET_SDK}" ] || fail "compileSdkVersion ${compile_sdk} < required ${MIN_TARGET_SDK}"

  local launchable_activity
  launchable_activity="$(printf '%s\n' "${badging}" | sed -n "s/^launchable-activity: name='\\([^']*\\)'.*/\\1/p")"
  if [[ "${launchable_activity}" != "neginheal.app.MainActivity" ]]; then
    fail "Launcher activity is '${launchable_activity:-unknown}'; expected neginheal.app.MainActivity in ${file}"
  fi

  echo "  status: PASS"
}

aab_contains() {
  local file="$1"
  local needle="$2"
  python3 - "${file}" "${needle}" <<'PY'
import sys
import zipfile

bundle, needle = sys.argv[1], sys.argv[2]
with zipfile.ZipFile(bundle) as archive:
    found = any(needle in name for name in archive.namelist())
print("yes" if found else "no")
PY
}

check_aab() {
  local file="$1"
  [ -f "${file}" ] || fail "AAB not found: ${file}"

  unzip -tq "${file}" >/dev/null 2>&1 || fail "AAB is not a valid zip archive: ${file}"
  [ "$(aab_contains "${file}" "AndroidManifest.xml")" = "yes" ] || fail "AAB manifest missing in ${file}"
  [ "$(aab_contains "${file}" "classes.dex")" = "yes" ] || fail "AAB dex payload missing in ${file}"

  echo "AAB: ${file}"
  echo "  structure: PASS"
  echo "  note: targetSdk is validated from the signed APK built in the same release"
  echo "  status: PASS"
}

check_gradle() {
  local file="${ROOT_DIR}/variables.gradle"
  local target compile
  target="$(sed -n 's/.*targetSdkVersion = \([0-9][0-9]*\).*/\1/p' "${file}" | head -1)"
  compile="$(sed -n 's/.*compileSdkVersion = \([0-9][0-9]*\).*/\1/p' "${file}" | head -1)"

  echo "Gradle: ${file}"
  echo "  compileSdkVersion: ${compile}"
  echo "  targetSdkVersion: ${target}"

  [ "${target}" -ge "${MIN_TARGET_SDK}" ] || fail "Gradle targetSdkVersion ${target} < required ${MIN_TARGET_SDK}"
  [ "${target}" -eq "${EXPECTED_TARGET_SDK}" ] || fail "Gradle targetSdkVersion ${target} != expected ${EXPECTED_TARGET_SDK}"
  echo "  status: PASS"
}

echo "Verifying Android release artifacts (min targetSdk ${MIN_TARGET_SDK})"
echo ""
check_gradle
echo ""
check_apk "${APK}"
echo ""
bash "${ROOT_DIR}/scripts/verify-apk-signature.sh" "${APK}"
echo ""
check_aab "${AAB}"
echo ""
echo "All checks passed."
