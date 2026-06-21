#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BUILD_GRADLE="${ROOT_DIR}/build.gradle"
SETTINGS_GRADLE="${ROOT_DIR}/settings.gradle"

"${ROOT_DIR}/scripts/with-icon-server.sh" npx bubblewrap update --skipVersionUpgrade

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

# Bubblewrap sometimes emits an empty versionName.
if grep -q 'versionName ""' "${ROOT_DIR}/app/build.gradle"; then
  if sed --version >/dev/null 2>&1; then
    sed -i 's/versionName ""/versionName "1"/' "${ROOT_DIR}/app/build.gradle"
  else
    sed -i '' 's/versionName ""/versionName "1"/' "${ROOT_DIR}/app/build.gradle"
  fi
fi

# Pin a stable androidbrowserhelper version compatible with compileSdk 35.
APP_BUILD_GRADLE="${ROOT_DIR}/app/build.gradle"
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
APP_BUILD_GRADLE="${ROOT_DIR}/app/build.gradle"
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

echo "Android project updated."
