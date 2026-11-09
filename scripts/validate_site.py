#!/usr/bin/env python3
"""Validate WoSoCenter static resources before uploading a GitHub Pages artifact.

No external Python packages are needed. Run from any working directory.
"""
import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parent.parent
ENTRY_POINTS = ("index.html", "fixture.html", "lineup.html")
REQUIRED = (
    *ENTRY_POINTS,
    "styles.css", "home.css", "lineup.css", "app.js", "lineup.js",
    ".nojekyll", "assets/fonts/fonts.css", "assets/fonts/files/Ario-Dots1.woff2",
    "data/teams.json", "data/players.json", "data/patterns.json",
    "data/flags.json", "data/national-flags.json", "data/team-colors.json",
    "data/lineup-palettes.json", "data/lineup-ready-palettes.json",
)
ERRORS = []
CHECKED = set()


def check_path(value, source):
    if not value or value.startswith(("#", "data:", "mailto:", "tel:", "javascript:", "blob:")):
        return
    parsed = urlsplit(value)
    if parsed.scheme or parsed.netloc:
        return  # External links are not checked locally.
    relative = unquote(parsed.path)
    if not relative:
        return
    if relative.startswith("/"):
        ERRORS.append(f"{source}: root-absolute path breaks repository subpath: {value}")
        return
    check = (ROOT / relative).resolve()
    if not check.is_relative_to(ROOT):
        ERRORS.append(f"{source}: path escapes project root: {value}")
    elif not check.is_file():
        ERRORS.append(f"{source}: missing asset: {value}")
    else:
        CHECKED.add(relative)


class LocalReferences(HTMLParser):
    def __init__(self, filename):
        super().__init__(convert_charrefs=True)
        self.filename = filename

    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        for attr in ("src", "href", "poster"):
            if attr in values:
                check_path(values[attr], self.filename)


for path in REQUIRED:
    if not (ROOT / path).is_file():
        ERRORS.append(f"Missing required file: {path}")

for filename in ENTRY_POINTS:
    file = ROOT / filename
    if file.is_file():
        LocalReferences(filename).feed(file.read_text(encoding="utf-8"))

for file in ROOT.rglob("*.css"):
    if "_site" in file.parts:
        continue
    contents = file.read_text(encoding="utf-8")
    for match in re.finditer(r"url\(\s*['\"]?([^'\")]+)", contents):
        url = match.group(1).strip()
        if url.startswith(("data:", "http:", "https:", "#")):
            continue
        # URLs in stylesheet are relative to the stylesheet's directory.
        resolved = (file.parent / urlsplit(url).path).resolve()
        if not resolved.is_file() or not resolved.is_relative_to(ROOT):
            ERRORS.append(f"{file.relative_to(ROOT)}: missing CSS resource: {url}")
        else:
            CHECKED.add(str(resolved.relative_to(ROOT)))

json_count = 0
for file in (ROOT / "data").glob("*.json"):
    try:
        data = json.loads(file.read_text(encoding="utf-8"))
    except (ValueError, UnicodeError) as exc:
        ERRORS.append(f"{file.name}: invalid JSON: {exc}")
        continue
    json_count += 1

    def scan(value):
        if isinstance(value, dict):
            for item in value.values():
                scan(item)
        elif isinstance(value, list):
            for item in value:
                scan(item)
        elif isinstance(value, str) and value.startswith("assets/"):
            check_path(value, file.relative_to(ROOT))

    scan(data)

print(f"Checked {len(REQUIRED)} essential files, {json_count} JSON data files, "
      f"{len(CHECKED)} local asset references.")
if ERRORS:
    print("Static validation FAILED:", file=sys.stderr)
    for error in ERRORS:
        print(" -", error, file=sys.stderr)
    sys.exit(1)
print("Static validation passed; the site is self-contained and ready to package.")
