#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
VARIABLES_GRADLE="${ROOT_DIR}/variables.gradle"

python3 - "${VARIABLES_GRADLE}" <<'PY'
from pathlib import Path
import re
import sys

path = Path(sys.argv[1])
text = path.read_text()
text = re.sub(r"minSdkVersion = \d+", "minSdkVersion = 23", text)
text = re.sub(r"compileSdkVersion = \d+", "compileSdkVersion = 35", text)
text = re.sub(r"targetSdkVersion = \d+", "targetSdkVersion = 35", text)
path.write_text(text)
PY

echo "Pinned minSdkVersion 23, compileSdkVersion 35, targetSdkVersion 35."
