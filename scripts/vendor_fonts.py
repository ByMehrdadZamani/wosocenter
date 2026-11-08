#!/usr/bin/env python3
"""Download original open-license WOFF2 fonts to this static site's assets folder.
Designed to run on GitHub Actions (server-side), never in visitors' browsers.
No credentials are needed; sources are public pinned-release CDN + GitHub.
"""
from pathlib import Path
from urllib.request import Request,urlopen
from urllib.error import URLError
import time

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'assets/fonts/files'
LICENSE=ROOT/'assets/fonts/licenses'
OUT.mkdir(parents=True,exist_ok=True)
LICENSE.mkdir(parents=True,exist_ok=True)

ASSETS={
 'vazirmatn':['Vazirmatn-FD-Regular.woff2','Vazirmatn-FD-Medium.woff2','Vazirmatn-FD-Bold.woff2'],
 'estedad':['Estedad-VF.woff2'],
 'mikhak':['Mikhak-VF.woff2'],
 'sahel':['Sahel-VF.woff2'],
 'shabnam':['Shabnam.woff2','Shabnam-Bold.woff2'],
 'gandom':['Gandom.woff2'],
 'rooyin':['RooyinFree-Regular.woff2','RooyinFree-Bold.woff2'],
 'noqte':['noqte.woff2'],
 'ario':['Ario-Dots1.woff2'],
 'lalezar':['Lalezar-Regular.woff2'],
 'cairo':['Cairo-VF.woff2'],
}
LICENSES={x:('LICENSE.txt' if x in {'shabnam','gandom'} else 'OFL.txt') for x in ASSETS}

def download(folder,name):
    paths=[
      f'https://raw.githubusercontent.com/amiryxe/next-persian-fonts/main/src/next-persian-fonts/{folder}/{name}',
      f'https://cdn.jsdelivr.net/npm/next-persian-fonts@1.5.0/{folder}/{name}',
    ]
    for url in paths:
        for attempt in range(3):
            try:
                req=Request(url,headers={'User-Agent':'WoSoCenter-font-vendor/1.0'})
                with urlopen(req,timeout=25) as response:
                    data=response.read(2500000)
                if not data or len(data)>2500000: raise ValueError('Empty or oversized file')
                return data
            except (URLError,TimeoutError,ValueError) as exc:
                print(f'Retry {folder}/{name}: {exc}',flush=True)
                time.sleep(attempt+1)
    raise RuntimeError(f'Cannot download required asset: {folder}/{name}')

def main():
    failures=[]
    for folder,names in ASSETS.items():
        for name in names:
            target=OUT/name
            if target.exists() and target.read_bytes()[:4]==b'wOF2':
                print('Already present:',target.relative_to(ROOT));continue
            try:
                data=download(folder,name)
                if data[:4]!=b'wOF2':raise ValueError('Invalid WOFF2 file')
                target.write_bytes(data)
                print('Saved:',target.relative_to(ROOT),len(data))
            except Exception as e: failures.append(str(e))
        license_file=LICENSE/f'{folder}.txt'
        if not license_file.exists():
            try: license_file.write_bytes(download(folder,LICENSES[folder]))
            except Exception as e:failures.append(str(e))
    if failures: raise SystemExit('Font vendoring incomplete: '+'; '.join(failures))
    assert (OUT/'Ario-Dots1.woff2').read_bytes()[:4]==b'wOF2'
    print('All selectable fonts are now self-hosted.')

if __name__=='__main__':main()
