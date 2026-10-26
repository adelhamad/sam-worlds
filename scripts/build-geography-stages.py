"""Partition each offline geography fact into exactly one themed stage."""
import json
from collections import defaultdict
from pathlib import Path

DATA = Path('src/content/geography/countries.json')
FAMILIAR = ['ARE', 'SAU', 'EGY', 'FRA', 'JPN', 'USA', 'BRA', 'AUS']
REGIONS = ['Asia', 'Africa', 'Europe', 'North America', 'South America', 'Oceania']
MODE_NAMES = {
    'capital': {'capital': 'Capital Call', 'reverse': 'City Clue', 'pin': 'Capital Pin'},
    'map': {'outline': 'Shape Scout', 'locate': 'World Locator', 'select': 'Map Match'},
    'flag': {'toCountry': 'Flag Finder', 'toFlag': 'Banner Match', 'toContinent': 'Continent Clue'},
}


def make_stages(kind, countries):
    modes = list(MODE_NAMES[kind])
    initial = {'capital': 'capital', 'map': 'outline', 'flag': 'toCountry'}[kind]
    opener = [f'{code}:{initial}' for code in FAMILIAR]
    used = set(opener)
    groups = [('First Flight', opener)]
    leftovers = []
    for mode in modes:
        for region in REGIONS:
            tokens = [f'{country["code"]}:{mode}' for country in countries
                      if country['continent'] == region
                      and (mode != 'pin' or country['capitalPoint'])
                      and f'{country["code"]}:{mode}' not in used]
            chapter = 1
            while len(tokens) >= 8:
                groups.append((f'{region} {MODE_NAMES[kind][mode]} {chapter}', tokens[:8]))
                tokens = tokens[8:]
                chapter += 1
            leftovers.extend(tokens)
    tours = 55 - len(groups)
    for i in range(tours):
        start = i * len(leftovers) // tours
        end = (i + 1) * len(leftovers) // tours
        groups.append((f'World Tour {i + 1}', leftovers[start:end]))
    assert len(groups) == 55, (kind, len(groups), len(leftovers))
    assert all(len(items) >= 6 for _, items in groups)
    assert len({token for _, items in groups for token in items}) == sum(len(items) for _, items in groups)
    prefix = {'capital': 'capitals', 'map': 'countrymaps', 'flag': 'flags'}[kind]
    if kind == 'flag':
        stages = json.loads(Path('src/content/flags/stages.json').read_text())
        for stage, (_, items) in zip(stages, groups):
            stage['params'] = {'items': items}
        Path('src/content/flags/stages.json').write_text(json.dumps(stages, indent=2) + '\n')
        print(kind, len(stages), 'stages', sum(len(items) for _, items in groups), 'facts')
        return
    stage_items = []
    for index, (name, items) in enumerate(groups, 1):
        stage_items.append({
            'id': f'{prefix}-{index:02d}', 'name': name,
            'generator': prefix, 'params': {'items': items},
            'questions': 6, 'mechanic': 'gate-run', 'payout': 12 + (index - 1) // 5,
            'intro': ['Follow the clues.', 'Explore a new place!']
        })
    target = Path(f'src/content/{prefix}/stages.json')
    target.parent.mkdir(exist_ok=True)
    target.write_text(json.dumps(stage_items, indent=2) + '\n')
    print(kind, len(stage_items), 'stages', sum(len(items) for _, items in groups), 'facts')


if __name__ == '__main__':
    countries = json.loads(DATA.read_text())['countries']
    for kind in ('capital', 'map', 'flag'):
        make_stages(kind, countries)
