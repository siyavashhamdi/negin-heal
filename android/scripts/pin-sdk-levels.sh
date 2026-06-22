#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
APP_BUILD_GRADLE="${ROOT_DIR}/app/build.gradle"

# Cafe Bazaar and Google Play require targetSdkVersion >= 34.
python3 - "${APP_BUILD_GRADLE}" <<'PY'
from pathlib import Path
import re
import sys

path = Path(sys.argv[1])
text = path.read_text()
text = re.sub(r'compileSdkVersion \d+', 'compileSdkVersion 35', text)
text = re.sub(r'targetSdkVersion \d+', 'targetSdkVersion 35', text)
if 'buildToolsVersion' not in text:
    text = text.replace(
        'compileSdkVersion 35\n',
        'compileSdkVersion 35\n    buildToolsVersion "35.0.1"\n',
        1,
    )
else:
    text = re.sub(r'buildToolsVersion "[^"]+"', 'buildToolsVersion "35.0.1"', text)
path.write_text(text)
PY
