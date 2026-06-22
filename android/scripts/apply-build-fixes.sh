#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BUILD_GRADLE="${ROOT_DIR}/build.gradle"

# Add Aliyun mirrors when dl.google.com is unreachable.
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
text = text.replace("        google()\n        mavenCentral()", mirror_block + "        mavenCentral()", 1)
text = text.replace("        google()\n        mavenCentral()", mirror_block + "        mavenCentral()", 1)
path.write_text(text)
PY
fi

# Keep Cafe Bazaar / Play Store SDK requirements pinned.
bash "${ROOT_DIR}/scripts/pin-sdk-levels.sh"

echo "Applied Capacitor Android build fixes."
