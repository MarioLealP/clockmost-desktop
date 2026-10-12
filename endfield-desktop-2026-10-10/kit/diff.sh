#!/usr/bin/env bash
# kit/diff.sh <baseline.png> <new.png> <diff.png> [x0,y0,x1,y1 ...] - wrapper for imgdiff.py (uv + pillow)
here="$(dirname "$(realpath "$0")")"
UV_PROJECT_ENVIRONMENT="${TMPDIR:-/tmp}/uvenv-efdiff" exec uv run -q --no-project --with pillow python -I "$here/imgdiff.py" "$@"
