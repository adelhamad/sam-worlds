import { areaLabel, populationLabel, rankedCountry } from "../engine/generators/countryStats";
import { flagEmoji } from "../engine/generators/geography";

export interface StatPair {
  codes: [string, string];
  metric: "area" | "population";
  showValues: boolean;
}

/** Equal-area circles turn a country statistic into a quick visual clue. */
export function StatCompare({ pair }: { pair: StatPair }) {
  const countries = pair.codes.map(rankedCountry);
  const values = countries.map((item) => pair.metric === "area" ? item.stats.landKm2 : item.stats.population);
  const largest = Math.max(...values);
  return (
    <div className={`stat-compare stat-${pair.metric}`}>
      {countries.map((item, index) => {
        const diameter = Math.max(17, 68 * Math.sqrt(values[index] / largest));
        const value = pair.metric === "area" ? areaLabel(values[index]) : populationLabel(values[index]);
        return (
          <div className="stat-country" key={item.country.code} role="img"
            aria-label={`${item.country.name}: ${value}`}>
            <div className="stat-bubble-wrap">
              <div className="stat-bubble" style={{ width: diameter, height: diameter }} aria-hidden="true" />
            </div>
            <div className="stat-country-name">{flagEmoji(item.country.iso2)} {item.country.name}</div>
            {pair.showValues && <div className="stat-value">{value}</div>}
          </div>
        );
      })}
    </div>
  );
}
