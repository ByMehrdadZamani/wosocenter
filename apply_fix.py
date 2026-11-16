#!/usr/bin/env python3
"""Apply the non-destructive Mac/desktop player-dialog layout fix to WoSoCenter.

Usage: copy this file into the repository root, then run: python3 apply_fix.py
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent
css_path = ROOT / 'lineup.css'
html_path = ROOT / 'lineup.html'

PATCH_MARKER = '/* Mac/Desktop player picker: prevent collapsed dialog body (v6.14.1). */'
PATCH = '''\n\n/* Mac/Desktop player picker: prevent collapsed dialog body (v6.14.1). */
@media (min-width: 741px) {
  .lineup-player-dialog {
    height: min(90vh, 900px);
    height: min(90dvh, 900px);
    box-sizing: border-box;
  }

  .lineup-player-dialog .lineup-player-body {
    flex: 1 1 auto;
    min-height: 0;
  }
}
'''

if not css_path.is_file() or not html_path.is_file():
    raise SystemExit('ERROR: lineup.css and lineup.html must be beside apply_fix.py in repository root.')

css = css_path.read_text(encoding='utf-8')
html = html_path.read_text(encoding='utf-8')

if '.lineup-player-dialog{width:min(1080px,calc(100vw - 24px))' not in css:
    raise SystemExit('ERROR: Current lineup.css layout differs from the reviewed version. No files changed.')

if PATCH_MARKER not in css:
    updated_css = css.rstrip('\n') + PATCH
else:
    updated_css = css

old_css_link = 'lineup.css?v=6.14.0'
new_css_link = 'lineup.css?v=6.14.1'
if old_css_link in html:
    updated_html = html.replace(old_css_link, new_css_link)
elif new_css_link in html:
    updated_html = html
else:
    raise SystemExit('ERROR: Stylesheet version in lineup.html is unexpected. No files changed.')

if updated_css != css:
    css_path.write_text(updated_css, encoding='utf-8')
if updated_html != html:
    html_path.write_text(updated_html, encoding='utf-8')

if updated_css == css and updated_html == html:
    print('Already applied. No changes needed.')
else:
    print('Success: lineup.css and lineup.html updated.')
print('Only commit these two files: lineup.css and lineup.html')
print('Suggested commands:')
print('  git add lineup.css lineup.html')
print('  git commit -m "Fix player picker dialog height on Mac desktop browsers"')
