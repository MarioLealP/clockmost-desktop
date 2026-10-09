#!/usr/bin/env python3
"""Save files from a Gemini reply without anyone reading it.

Gemini prints each file as:
    === FILE: concepts/<name> ===
    ```<lang>
    ...content...
    ```
Only paths under concepts/ are accepted. Prints a one-line summary per file (name, lines, bytes).
Usage: extract.py <reply.txt> [mockups_dir]
"""
import re
import sys
from pathlib import Path

reply = Path(sys.argv[1]).read_text(errors="replace")
root = Path(sys.argv[2] if len(sys.argv) > 2 else Path(__file__).resolve().parent.parent)
pat = re.compile(r"^=== FILE: (concepts/[A-Za-z0-9._-]+) ===\s*\n```[A-Za-z]*\n(.*?)\n```", re.S | re.M)
found = 0
for rel, body in pat.findall(reply):
    out = root / rel
    if out.parent != root / "concepts":
        print("skipped (path):", rel)
        continue
    out.write_text(body.rstrip("\n") + "\n", encoding="utf-8")
    found += 1
    print(f"saved {rel}: {body.count(chr(10)) + 1} lines, {len(body)} bytes")
if not found:
    print("NO FILES FOUND in reply")
    sys.exit(1)
