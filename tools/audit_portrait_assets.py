#!/usr/bin/env python3
"""Validate WoSoCenter's registered portrait assets; read-only, requires Pillow."""
from pathlib import Path
from PIL import Image
import json, statistics, sys

ROOT=Path(__file__).resolve().parent.parent
players=json.loads((ROOT/'data/players.json').read_text(encoding='utf-8'))
errors=[]; stats={}
for p in players:
    pid=p.get('id','(unknown)')
    team=p.get('teamId')
    if not all(p.get(key) for key in ('id','name','teamId','image','lineupPortrait','pickerPortrait','flag','positionGroup')):
        errors.append(f'{pid}: required field missing')
    for key in ('image','lineupPortrait','pickerPortrait'):
        target=ROOT/p.get(key,'(missing)')
        if not target.is_file():
            errors.append(f'{pid}: missing {key} = {target}')
            continue
        try:
            with Image.open(target) as im:
                if key=='lineupPortrait' and im.size!=(300,310):
                    errors.append(f'{pid}: calibrated portrait must be 300x310, got {im.size}')
                if key=='pickerPortrait' and im.size!=(256,246):
                    errors.append(f'{pid}: picker image must be 256x246, got {im.size}')
                if key!='image':
                    alpha=im.convert('RGBA').getchannel('A')
                    bbox=alpha.getbbox()
                    if not bbox: errors.append(f'{pid}: transparent/empty {key}')
                    elif key=='pickerPortrait' and (min(bbox[0],bbox[1],im.width-bbox[2],im.height-bbox[3])<3):
                        errors.append(f'{pid}: picker hair/jersey touches canvas edge {bbox}')
        except Exception as err:errors.append(f'{pid}: cannot decode {key}: {err}')
    stats.setdefault(team,[]).append(p.get('lineupCalibration',{}).get('headWidth',0))
ids=[p.get('id') for p in players]
if len(set(ids))!=len(ids):errors.append('duplicate player IDs')
for name,widths in stats.items():
    vals=[float(v) for v in widths if isinstance(v,(int,float)) and v>0]
    print(f'{name}: {len(widths)} players; nominal head width median {statistics.median(vals):.1f}px' if vals else f'{name}: {len(widths)} players (no head-width metadata)')
print(f'Asset audit: {len(players)} players, {len(errors)} error(s)')
for error in errors:print('ERROR:',error)
if errors:sys.exit(1)
