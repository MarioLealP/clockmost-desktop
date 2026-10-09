#!/bin/bash
# Build one concept and open it in the Windows browser.  Usage: ./try.sh <slug>   (e.g. 7m-magnetic-anomaly)
set -euo pipefail
cd "$(dirname "$0")"
slug=${1:?usage: ./try.sh <slug>  - slugs: $(ls concepts/*.js | xargs -n1 basename | sed 's/\.js$//' | tr '\n' ' ')}
python3 build.py try "$slug" >/dev/null
cmd.exe /c start "" "E:\\Felt\\review\\try\\pending\\$slug.html" 2>/dev/null
echo "opened $slug (E:\\Felt\\review\\try\\pending\\$slug.html)"
