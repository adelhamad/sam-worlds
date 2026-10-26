"""Bundle a fixed, offline 2024 World Bank country-stat snapshot.

Land area is FAOSTAT's AG.LND.TOTL.K2 series via World Bank. Nicaragua's
latest available land-area value is 2023. Population is SP.POP.TOTL for 2024.
Run from the repository root: python3 scripts/build-country-stats.py
"""

import json
from pathlib import Path
from urllib.request import urlopen


COUNTRIES = Path("src/content/geography/countries.json")
OUTPUT = Path("src/content/geography/countryStats.json")
API = "https://api.worldbank.org/v2/country/all/indicator"


def values(indicator, year):
    url = f"{API}/{indicator}?date={year}&format=json&per_page=500"
    with urlopen(url, timeout=30) as response:
        metadata, entries = json.load(response)
    if metadata["pages"] != 1:
        raise ValueError(f"Unexpected pagination for {indicator}: {metadata['pages']}")
    return {entry["countryiso3code"]: entry["value"] for entry in entries
            if entry.get("value") is not None and entry.get("countryiso3code")}


def main():
    countries = json.loads(COUNTRIES.read_text())["countries"]
    land_2024 = values("AG.LND.TOTL.K2", 2024)
    land_2023 = values("AG.LND.TOTL.K2", 2023)
    population_2024 = values("SP.POP.TOTL", 2024)
    rows = []
    for country in countries:
        code = country["code"]
        land_year = 2024 if code in land_2024 else 2023
        land = (land_2024 if land_year == 2024 else land_2023).get(code)
        population = population_2024.get(code)
        if land is None or population is None or land <= 0 or population <= 0:
            raise ValueError(f"Missing or invalid statistics for {code}")
        rows.append({"code": code, "landKm2": land, "landYear": land_year,
                     "population": population, "populationYear": 2024})
    OUTPUT.write_text(json.dumps({
        "source": "World Bank World Development Indicators; land area from FAOSTAT/FAO; population from UN WPP and national statistical sources. CC BY 4.0.",
        "landIndicator": "AG.LND.TOTL.K2",
        "populationIndicator": "SP.POP.TOTL",
        "sourceUrls": ["https://data.worldbank.org/indicator/AG.LND.TOTL.K2",
                       "https://data.worldbank.org/indicator/SP.POP.TOTL",
                       "https://data.worldbank.org/summary-terms-of-use"],
        "stats": rows,
    }, separators=(",", ":")) + "\n")
    print(f"Bundled land area and population for {len(rows)} countries")


if __name__ == "__main__":
    main()
