"""Build three 55-stage geography ladders with one-use fact assignments."""

import itertools
import json
import random
from pathlib import Path


ROOT = Path("src/content")
COUNTRIES = json.loads((ROOT / "geography/countries.json").read_text())["countries"]
STATS = {row["code"]: row for row in
         json.loads((ROOT / "geography/countryStats.json").read_text())["stats"]}
CODES = [country["code"] for country in COUNTRIES]
RNG = random.Random(260426)
FAMILIAR = ["ARE", "SAU", "EGY", "FRA", "JPN", "USA", "BRA", "AUS"]
LAND_LAUNCH = [("ARE", "EGY"), ("ARE", "FRA"), ("ARE", "JPN"), ("SAU", "BRA"),
               ("SAU", "USA"), ("EGY", "AUS"), ("FRA", "BRA"), ("JPN", "USA")]
PEOPLE_LAUNCH = [("ARE", "SAU"), ("EGY", "USA"), ("FRA", "BRA"), ("JPN", "AUS"),
                 ("SAU", "JPN"), ("BRA", "AUS"), ("ARE", "EGY"), ("FRA", "USA")]


def pair_key(a, b):
    return tuple(sorted((a, b)))


def pick_pairs(metric, count, used, minimum=1.0, maximum=float("inf"), target=None):
    pairs = list(itertools.combinations(CODES, 2))
    RNG.shuffle(pairs)
    chosen = []
    for a, b in pairs:
        key = pair_key(a, b)
        if key in used:
            continue
        x, y = STATS[a][metric], STATS[b][metric]
        ratio = max(x, y) / min(x, y)
        if ratio < minimum or ratio > maximum or (target and abs(ratio / target - 1) > 0.12):
            continue
        chosen.append((a, b))
        used.add(key)
        if len(chosen) == count:
            return chosen
    raise ValueError(f"Only {len(chosen)}/{count} pairs for {metric}, {target}")


def pick_triples(count, used):
    triples = []
    seen = set()
    attempts = 0
    while len(triples) < count and attempts < 100_000:
        attempts += 1
        codes = RNG.sample(CODES, 3)
        codes.sort(key=lambda code: STATS[code]["landKm2"], reverse=True)
        key = tuple(sorted(codes))
        if key in seen:
            continue
        areas = [STATS[code]["landKm2"] for code in codes]
        if areas[0] / areas[1] < 1.5 or areas[1] / areas[2] < 1.5 or areas[0] / areas[2] > 30:
            continue
        pairs = [pair_key(a, b) for a, b in itertools.combinations(codes, 2)]
        if any(pair in used for pair in pairs):
            continue
        seen.add(key)
        used.update(pairs)
        triples.append(codes)
    if len(triples) != count:
        raise ValueError(f"Only {len(triples)}/{count} distinct land triples")
    return triples


def stage(prefix, index, title, tokens, intro):
    return {
        "id": f"{prefix}-{index:02d}", "name": title,
        "generator": prefix, "params": {"items": tokens},
        "questions": 6, "mechanic": "gate-run",
        "payout": 12 + (index - 1) // 5, "intro": intro,
    }


def save(prefix, stages):
    assert len(stages) == 55
    assert all(len(row["params"]["items"]) == 8 for row in stages)
    tokens = [item for row in stages for item in row["params"]["items"]]
    assert len(tokens) == len(set(tokens))
    target = ROOT / prefix / "stages.json"
    target.parent.mkdir(exist_ok=True)
    target.write_text(json.dumps(stages, indent=2) + "\n")
    print(prefix, len(stages), "stages", len(tokens), "distinct prompts")


def land_duels(used):
    stages = []
    chapters = [("larger", 18, "Larger", 3.0),
                ("smaller", 18, "Smaller", 2.0)]
    for mode, count, title, minimum in chapters:
        opener = LAND_LAUNCH if mode == "larger" else []
        used.update(pair_key(a, b) for a, b in opener)
        pairs = opener + pick_pairs("landKm2", count * 8 - len(opener), used, minimum, maximum=30)
        for offset in range(count):
            tokens = [f"{a}:{b}:{mode}" for a, b in pairs[offset * 8:(offset + 1) * 8]]
            name = "Land Launch" if mode == "larger" and offset == 0 else f"{title} {offset + 1}"
            stages.append(stage("landduel", len(stages) + 1, name, tokens,
                                ["Compare two countries.", "Choose the land size winner!"]))
    triples = pick_triples(19 * 8, used)
    for offset in range(19):
        tokens = [f"{a}:{b}:{c}:order" for a, b, c in triples[offset * 8:(offset + 1) * 8]]
        stages.append(stage("landduel", len(stages) + 1, f"Podium {offset + 1}", tokens,
                            ["Put three countries in order.", "Biggest land first!"]))
    save("landduel", stages)


def area_atlas(used):
    stages = []
    codes = FAMILIAR + sorted((code for code in CODES if code not in FAMILIAR),
                              key=lambda code: STATS[code]["landKm2"])
    for offset in range(18):
        tokens = [f"{code}:estimate" for code in codes[offset * 8:(offset + 1) * 8]]
        name = "Area Launch" if offset == 0 else f"Measure {offset + 1}"
        stages.append(stage("areaatlas", len(stages) + 1, name, tokens,
                            ["Read a country's land area.", "Pick the closest size!"]))
    for factor, count in [(2, 9), (3, 9), (5, 9), (10, 10)]:
        pairs = pick_pairs("landKm2", count * 8, used, target=factor)
        for offset in range(count):
            tokens = [f"{a}:{b}:ratio{factor}" for a, b in pairs[offset * 8:(offset + 1) * 8]]
            stages.append(stage("areaatlas", len(stages) + 1, f"{factor}× Land {offset + 1}", tokens,
                                ["Compare the land-area numbers.", "How many times bigger?"]))
    save("areaatlas", stages)


def population_world():
    stages = []
    codes = FAMILIAR + sorted((code for code in CODES if code not in FAMILIAR),
                              key=lambda code: STATS[code]["population"])
    for offset in range(18):
        tokens = [f"{code}:estimate" for code in codes[offset * 8:(offset + 1) * 8]]
        name = "People Launch" if offset == 0 else f"Count {offset + 1}"
        stages.append(stage("population", len(stages) + 1, name, tokens,
                            ["Population means people living there.", "Choose the closest number!"]))
    used = set()
    for mode, count, title in [("more", 18, "More People"), ("fewer", 19, "Fewer People")]:
        opener = PEOPLE_LAUNCH if mode == "more" else []
        used.update(pair_key(a, b) for a, b in opener)
        pairs = opener + pick_pairs("population", count * 8 - len(opener), used, minimum=1.5, maximum=30)
        for offset in range(count):
            tokens = [f"{a}:{b}:{mode}" for a, b in pairs[offset * 8:(offset + 1) * 8]]
            stages.append(stage("population", len(stages) + 1, f"{title} {offset + 1}", tokens,
                                ["Compare two countries.", "Think about how many people live there!"]))
    save("population", stages)


if __name__ == "__main__":
    used_land_pairs = set()
    land_duels(used_land_pairs)
    area_atlas(used_land_pairs)
    population_world()
