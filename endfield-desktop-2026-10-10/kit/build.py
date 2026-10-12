#!/usr/bin/env python3
"""Build concepts into standalone HTML pages (handoff copy - writes only inside this folder).

Each concept = ../concepts/<slug>.js (+ optional .css) + ../concepts/<slug>.json {"title", "about"}.
Output: ../out/<slug>.html - open it in any browser.
Usage: python3 kit/build.py [slug ...]   (no slugs = build all)
"""
import json
import sys
from pathlib import Path

KIT = Path(__file__).parent
ROOT = KIT.parent
CONCEPTS = ROOT / "concepts"
OUT = ROOT / "out"


def build(slug: str) -> None:
    meta = json.loads((CONCEPTS / f"{slug}.json").read_text(encoding="utf-8"))
    js = (CONCEPTS / f"{slug}.js").read_text(encoding="utf-8")
    css_path = CONCEPTS / f"{slug}.css"
    css = css_path.read_text(encoding="utf-8") if css_path.exists() else ""
    html = (KIT / "harness.html").read_text(encoding="utf-8")
    html = html.replace("/*TITLE*/", meta["title"]).replace("/*ABOUT*/", meta["about"])
    html = html.replace("/*CONCEPT_CSS*/", css).replace("/*CONCEPT_JS*/", js)
    (OUT / f"{slug}.html").write_text(html, encoding="utf-8")


def main() -> None:
    OUT.mkdir(exist_ok=True)
    slugs = sys.argv[1:] or sorted(p.stem for p in CONCEPTS.glob("*.js"))
    for slug in slugs:
        build(slug)
        print("built", OUT / f"{slug}.html")


if __name__ == "__main__":
    main()
