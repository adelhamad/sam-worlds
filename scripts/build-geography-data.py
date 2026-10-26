"""Build offline country shapes and capital facts from Natural Earth 110m v5.1.1.

Inputs are GeoJSON converted from Natural Earth's public-domain Admin 0 Countries
and Populated Places downloads with ogr2ogr. Capital names are reviewed against
US State Department's Independent States list (June 2024); ambiguous/multiple
capitals and disputed entries are omitted from the quiz.

https://www.naturalearthdata.com/downloads/110m-cultural-vectors/
https://2021-2025.state.gov/independent-states-in-the-world/
"""
import json
import math
import sys
from collections import defaultdict
from pathlib import Path

EXCLUDE = {
    'BEN', 'BDI', 'BOL', 'CIV', 'ISR', 'KOS', 'MYS', 'MMR', 'NLD', 'LKA',
    'TZA', 'SWZ', 'IDN', 'TWN', 'SOL', 'RUS', 'CYP', 'TUR',
}
NAMES = {
    'CHN': 'China', 'USA': 'United States', 'CZE': 'Czechia',
    'TLS': 'Timor-Leste', 'BHS': 'Bahamas', 'GMB': 'Gambia',
    'COD': 'DR Congo', 'COG': 'Republic of the Congo',
}
CAPITALS = {
    'BRA': 'Brasília', 'COL': 'Bogotá', 'CRI': 'San José', 'DNK': 'Copenhagen',
    'GTM': 'Guatemala City', 'PRY': 'Asunción', 'UKR': 'Kyiv',
    'CMR': 'Yaoundé', 'ISL': 'Reykjavík', 'TCD': "N'Djamena",
    'MDA': 'Chișinău', 'TGO': 'Lomé', 'TTO': 'Port of Spain',
    'YEM': "Sana'a",
}
ISO2 = {'FRA': 'FR', 'NOR': 'NO'}


def outer_rings(geometry):
    if geometry['type'] == 'Polygon':
        return [geometry['coordinates'][0]]
    return [polygon[0] for polygon in geometry['coordinates']]


def ring_area(ring):
    return abs(sum(x1 * y2 - x2 * y1 for (x1, y1), (x2, y2) in zip(ring, ring[1:])))


def wrapped_lon(lon, center):
    return center + (lon - center + 180) % 360 - 180


def path(rings, center=None):
    return ''.join('M' + 'L'.join(
        f'{(wrapped_lon(x, center) if center is not None else x) + 180:.1f},{90 - y:.1f}'
        for x, y in ring) + 'Z' for ring in rings)


def view_box(rings, center):
    xs = [wrapped_lon(x, center) + 180 for ring in rings for x, _ in ring]
    ys = [90 - y for ring in rings for _, y in ring]
    x, y, w, h = min(xs), min(ys), max(xs) - min(xs), max(ys) - min(ys)
    pad = max(w, h) * 0.08
    return [round(x - pad, 1), round(y - pad, 1), round(w + pad * 2, 1), round(h + pad * 2, 1)]


def main_ring(rings):
    return max(rings, key=ring_area)


def nearby_rings(rings, main):
    center_lon = sum(x for x, _ in main) / len(main)
    center_lat = sum(y for _, y in main) / len(main)
    selected = []
    for ring in rings:
        lon = sum(wrapped_lon(x, center_lon) for x, _ in ring) / len(ring)
        lat = sum(y for _, y in ring) / len(ring)
        if abs(lon - center_lon) <= 30 and abs(lat - center_lat) <= 20:
            selected.append(ring)
    return selected, center_lon


def point_in_ring(point, ring):
    x, y = point
    inside = False
    for (x1, y1), (x2, y2) in zip(ring, ring[1:]):
        if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / (y2 - y1) + x1:
            inside = not inside
    return inside


def build(countries_path, places_path):
    countries = json.loads(Path(countries_path).read_text())['features']
    places = json.loads(Path(places_path).read_text())['features']
    capitals = defaultdict(list)
    for place in places:
        info = place['properties']
        if info['FEATURECLA'] == 'Admin-0 capital':
            capitals[info['ADM0_A3']].append(place)
    result = []
    for feature in countries:
        info = feature['properties']
        code = info['ADM0_A3']
        if code in EXCLUDE or len(capitals[code]) != 1:
            continue
        city = capitals[code][0]
        rings = outer_rings(feature['geometry'])
        main = main_ring(rings)
        local_rings, center_lon = nearby_rings(rings, main)
        box = view_box(local_rings, center_lon)
        lon, lat = city['geometry']['coordinates']
        x, y = wrapped_lon(lon, center_lon) + 180, 90 - lat
        marker_in_box = (box[0] <= x <= box[0] + box[2] and
                         box[1] <= y <= box[1] + box[3] and
                         any(point_in_ring((lon, lat), ring) for ring in local_rings))
        result.append({
            'code': code,
            'iso2': ISO2.get(code, info['ISO_A2']),
            'name': NAMES.get(code, info['NAME_EN']),
            'capital': CAPITALS.get(code, city['properties']['NAMEASCII']),
            'continent': info['CONTINENT'],
            'path': path(local_rings, center_lon),
            'worldPath': path(rings),
            'viewBox': box,
            'worldPoint': [round(sum(v[0] for v in main) / len(main) + 180, 1),
                           round(90 - sum(v[1] for v in main) / len(main), 1)],
            'capitalPoint': [round(x, 1), round(y, 1)] if marker_in_box else None,
        })
    return sorted(result, key=lambda row: row['name'])


if __name__ == '__main__':
    output = {'source': 'Natural Earth 110m v5.1.1; US State Department capitals reviewed 2024',
              'countries': build(sys.argv[1], sys.argv[2])}
    Path('src/content/geography/countries.json').write_text(json.dumps(output, separators=(',', ':')) + '\n')
    print(len(output['countries']), 'countries')
