#!/usr/bin/env python3
"""Turn Els's Excel word lists into data/woorden.csv for the app.

    python3 tools/importeer.py

Reads every .xlsx in lijsten/ (one file per theme; the file name is the theme
name, e.g. "Thema 5, taak 2.xlsx"). Els's format: one word per row in
column A, nouns written dictionary-style as "afslag, de" or "de praktijk".

Example sentences and pictures are not in her files. They live in
data/aanvulling.csv (woord;voorbeeldzin;afbeelding), maintained by us and
checked by Els. The sentence marks the practised word with [brackets].

Standard library only, so it runs on any Mac without installing anything.
"""
import csv
import re
import sys
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LIJSTEN = ROOT / 'lijsten'
AANVULLING = ROOT / 'data' / 'aanvulling.csv'
UIT = ROOT / 'data' / 'woorden.csv'

NS = '{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'


def column_a(path):
    """All non-empty cells in column A of the first sheet."""
    with zipfile.ZipFile(path) as z:
        shared = []
        if 'xl/sharedStrings.xml' in z.namelist():
            for si in ET.fromstring(z.read('xl/sharedStrings.xml')).iter(NS + 'si'):
                shared.append(''.join(t.text or '' for t in si.iter(NS + 't')))
        sheet = ET.fromstring(z.read('xl/worksheets/sheet1.xml'))
        for cell in sheet.iter(NS + 'c'):
            if not re.fullmatch(r'A\d+', cell.get('r', '')):
                continue
            if cell.get('t') == 'inlineStr':
                text = ''.join(t.text or '' for t in cell.iter(NS + 't'))
            else:
                v = cell.find(NS + 'v')
                if v is None:
                    continue
                text = shared[int(v.text)] if cell.get('t') == 's' else v.text
            text = ' '.join(text.split())
            if text:
                yield text


def split_article(entry):
    """'afslag, de' -> ('afslag', 'de'); 'de praktijk' -> ('praktijk', 'de')."""
    m = re.fullmatch(r'(.+?),\s*(de|het)', entry, re.I)
    if m:
        return m.group(1), m.group(2).lower()
    m = re.fullmatch(r'(de|het)\s+(.+)', entry, re.I)
    if m:
        return m.group(2), m.group(1).lower()
    return entry, ''


def load_aanvulling():
    if not AANVULLING.exists():
        return {}
    with AANVULLING.open(encoding='utf-8') as f:
        return {r['woord'].strip().lower(): r for r in csv.DictReader(f, delimiter=';')}


def main():
    files = sorted(LIJSTEN.glob('*.xlsx'))
    if not files:
        sys.exit(f'Geen .xlsx-bestanden gevonden in {LIJSTEN}')

    extra = load_aanvulling()
    rows, missing = [], []
    for path in files:
        thema = path.stem
        for entry in column_a(path):
            woord, lidwoord = split_article(entry)
            aanv = extra.get(woord.lower(), {})
            zin = (aanv.get('voorbeeldzin') or '').strip()
            if zin and not re.search(r'\[[^\]]+\]', zin):
                print(f'  let op: zin zonder [haakjes] bij "{woord}"')
            if not zin:
                missing.append(f'{thema}: {woord}')
            rows.append([thema, woord, lidwoord, zin, (aanv.get('afbeelding') or '').strip()])

    with UIT.open('w', encoding='utf-8', newline='') as f:
        w = csv.writer(f, delimiter=';', lineterminator='\n')
        w.writerow(['thema', 'woord', 'lidwoord', 'voorbeeldzin', 'afbeelding'])
        w.writerows(rows)

    print(f'{len(rows)} woorden uit {len(files)} lijsten -> {UIT.relative_to(ROOT)}')
    if missing:
        print(f'{len(missing)} woorden nog zonder voorbeeldzin.')


if __name__ == '__main__':
    main()
