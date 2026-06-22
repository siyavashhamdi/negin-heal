#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BUILD_GRADLE="${ROOT_DIR}/build.gradle"
SETTINGS_GRADLE="${ROOT_DIR}/settings.gradle"
APP_BUILD_GRADLE="${ROOT_DIR}/app/build.gradle"

# Bubblewrap still generates jcenter(); keep Maven Central for reliable builds.
if sed --version >/dev/null 2>&1; then
  sed -i 's/jcenter()/mavenCentral()/g' "${BUILD_GRADLE}"
else
  sed -i '' 's/jcenter()/mavenCentral()/g' "${BUILD_GRADLE}"
fi

# Use a widely published Android Gradle Plugin version.
if sed --version >/dev/null 2>&1; then
  sed -i "s/com.android.tools.build:gradle:[0-9.]\+/com.android.tools.build:gradle:8.7.2/" "${BUILD_GRADLE}"
else
  sed -i '' "s/com.android.tools.build:gradle:[0-9.]*/com.android.tools.build:gradle:8.7.2/" "${BUILD_GRADLE}"
fi

# Point repositories at mirrors when dl.google.com is unreachable.
if ! grep -q "maven.aliyun.com" "${BUILD_GRADLE}"; then
  python3 - "${BUILD_GRADLE}" <<'PY'
from pathlib import Path
import sys

path = Path(sys.argv[1])
text = path.read_text()
mirror_block = """        maven { url 'https://maven.aliyun.com/repository/google' }
        maven { url 'https://maven.aliyun.com/repository/gradle-plugin' }
        maven { url 'https://maven.aliyun.com/repository/public' }
"""
allprojects_mirror = """        maven { url 'https://maven.aliyun.com/repository/google' }
        maven { url 'https://maven.aliyun.com/repository/public' }
"""
text = text.replace("        google()\n        mavenCentral()", mirror_block + "        mavenCentral()", 1)
text = text.replace("        google()\n        mavenCentral()", allprojects_mirror + "        mavenCentral()", 1)
path.write_text(text)
PY
fi

cat > "${SETTINGS_GRADLE}" <<'EOF'
pluginManagement {
    repositories {
        maven { url 'https://maven.aliyun.com/repository/google' }
        maven { url 'https://maven.aliyun.com/repository/gradle-plugin' }
        maven { url 'https://maven.aliyun.com/repository/public' }
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.PREFER_SETTINGS)
    repositories {
        maven { url 'https://maven.aliyun.com/repository/google' }
        maven { url 'https://maven.aliyun.com/repository/public' }
        mavenCentral()
    }
}

include ':app'
EOF

# Sync versionName from twa-manifest.json when bubblewrap leaves it empty.
TWA_MANIFEST="${ROOT_DIR}/twa-manifest.json"
if [ -f "${TWA_MANIFEST}" ]; then
  APP_VERSION_NAME="$(python3 - "${TWA_MANIFEST}" <<'PY'
import json
import sys
from pathlib import Path

manifest = json.loads(Path(sys.argv[1]).read_text())
print(manifest.get("appVersionName", ""))
PY
)"
  if [ -n "${APP_VERSION_NAME}" ]; then
    if sed --version >/dev/null 2>&1; then
      sed -i "s/versionName \"[^\"]*\"/versionName \"${APP_VERSION_NAME}\"/" "${APP_BUILD_GRADLE}"
    else
      sed -i '' "s/versionName \"[^\"]*\"/versionName \"${APP_VERSION_NAME}\"/" "${APP_BUILD_GRADLE}"
    fi
  elif grep -q 'versionName ""' "${APP_BUILD_GRADLE}"; then
    if sed --version >/dev/null 2>&1; then
      sed -i 's/versionName ""/versionName "1"/' "${APP_BUILD_GRADLE}"
    else
      sed -i '' 's/versionName ""/versionName "1"/' "${APP_BUILD_GRADLE}"
    fi
  fi
fi

# Pin a stable androidbrowserhelper version compatible with compileSdk 35.
if ! grep -q "androidbrowserhelper:2.5.0" "${APP_BUILD_GRADLE}"; then
  python3 - "${APP_BUILD_GRADLE}" <<'PY'
from pathlib import Path
import re
import sys

path = Path(sys.argv[1])
text = path.read_text()
replacement = """dependencies {
    implementation fileTree(include: ['*.jar'], dir: 'libs')

    implementation 'com.google.androidbrowserhelper:androidbrowserhelper:2.5.0'
}
"""
text = re.sub(r"dependencies \{[\s\S]*?\n\}", replacement, text, count=1)
path.write_text(text)
PY
fi

# Match installed SDK platforms/build-tools when bubblewrap targets newer API levels.
if sed --version >/dev/null 2>&1; then
  sed -i 's/compileSdkVersion 36/compileSdkVersion 35/' "${APP_BUILD_GRADLE}"
  sed -i '/buildToolsVersion/!b; n' "${APP_BUILD_GRADLE}" 2>/dev/null || true
  grep -q 'buildToolsVersion' "${APP_BUILD_GRADLE}" || sed -i '/compileSdkVersion 35/a\    buildToolsVersion "35.0.1"' "${APP_BUILD_GRADLE}"
else
  sed -i '' 's/compileSdkVersion 36/compileSdkVersion 35/' "${APP_BUILD_GRADLE}"
  if ! grep -q 'buildToolsVersion' "${APP_BUILD_GRADLE}"; then
    sed -i '' '/compileSdkVersion 35/a\
    buildToolsVersion "35.0.1"
' "${APP_BUILD_GRADLE}"
  fi
fi

bash "${ROOT_DIR}/scripts/pin-sdk-levels.sh"
