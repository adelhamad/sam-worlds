"""Build the World Tour map backdrop from Natural Earth 110m v5.1.1.

The tap-the-map exercise draws every country in countries.json, but that file
leaves out territories without one clear capital (Russia, Türkiye, Indonesia,
Greenland, ...). This script joins all of those left-out shapes into ONE plain
SVG path so the map has no holes. Antarctica is skipped.

Input: Natural Earth's public-domain Admin 0 Countries as GeoJSON.
https://www.naturalearthdata.com/downloads/110m-cultural-vectors/

Usage: python3 -I scripts/build-land-backdrop.py ne_110m_admin_0_countries.geojson

Same conventions as build-geography-data.py: x = lon + 180, y = 90 - lat,
one decimal.
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
COUNTRIES = ROOT / 'src/content/geography/countries.json'
OUTPUT = ROOT / 'src/content/geography/land.json'
SKIP = {'ATA'}


def outer_rings(geometry):
    if geometry['type'] == 'Polygon':
        return [geometry['coordinates'][0]]
    return [polygon[0] for polygon in geometry['coordinates']]


def ring_path(ring):
    points = []
    for lon, lat in ring:
        point = f'{lon + 180:.1f},{90 - lat:.1f}'
        if not points or points[-1] != point:
            points.append(point)
    if len(points) > 1 and points[0] == points[-1]:
        points.pop()
    # A ring that rounds down to a line or a dot draws nothing.
    return 'M' + 'L'.join(points) + 'Z' if len(set(points)) >= 3 else ''


def build(countries_path):
    known = {row['code'] for row in json.loads(COUNTRIES.read_text())['countries']}
    features = json.loads(Path(countries_path).read_text())['features']
    names, parts = [], []
    for feature in features:
        info = feature['properties']
        code = info['ADM0_A3']
        if code in known or code in SKIP:
            continue
        names.append(f"{code} {info['NAME_EN']}")
        parts.extend(ring_path(ring) for ring in outer_rings(feature['geometry']))
    return names, ''.join(parts)


if __name__ == '__main__':
    names, path = build(sys.argv[1])
    output = {'source': 'Natural Earth 110m v5.1.1 (public domain); territories absent from countries.json',
              'path': path}
    OUTPUT.write_text(json.dumps(output, separators=(',', ':')) + '\n')
    print(len(names), 'territories,', len(path), 'bytes')
    print(', '.join(sorted(names)))
