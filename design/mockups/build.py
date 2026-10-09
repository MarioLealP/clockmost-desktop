#!/usr/bin/env python3
"""Build the desktop-concept mockups into a review-app batch.

Each concept = concepts/<slug>.js (+ optional .css) + concepts/<slug>.json {"title", "about"}.
Output: E:/Felt/review/<batch>/pending/<slug>.html + <slug>.json sidecar, batch.json.
Usage: python3 build.py [batch-name] [slug ...]
"""
import json
import sys
from pathlib import Path

HERE = Path(__file__).parent
REVIEW = Path("/mnt/e/Felt/review")


def build(slug: str, out: Path) -> None:
    meta = json.loads((HERE / "concepts" / f"{slug}.json").read_text())
    js = (HERE / "concepts" / f"{slug}.js").read_text()
    css_path = HERE / "concepts" / f"{slug}.css"
    css = css_path.read_text() if css_path.exists() else ""
    html = (HERE / "harness.html").read_text()
    html = html.replace("/*TITLE*/", meta["title"]).replace("/*ABOUT*/", meta["about"])
    html = html.replace("/*CONCEPT_CSS*/", css).replace("/*CONCEPT_JS*/", js)
    (out / f"{slug}.html").write_text(html, encoding="utf-8")
    side = {"title": meta["title"], "info": {"about": meta["about"], "source": meta.get("source", "")}}
    (out / f"{slug}.json").write_text(json.dumps(side, indent=1), encoding="utf-8")


def main() -> None:
    batch = sys.argv[1] if len(sys.argv) > 1 else "desktop-concepts"
    slugs = sys.argv[2:] or sorted(p.stem for p in (HERE / "concepts").glob("*.js"))
    root = REVIEW / batch
    out = root / "pending"
    out.mkdir(parents=True, exist_ok=True)
    (root / "batch.json").write_text(json.dumps({"title": "Desktop design concepts (live mockups)", "dest": None}, indent=1))
    for slug in slugs:
        build(slug, out)
        print("built", slug)


if __name__ == "__main__":
    main()
