import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGame } from "../state/store";
import { completedInWorld, focusWorldIn, WORLDS, type WorldDef } from "../content/worlds";
import { CATEGORIES, categoryOf } from "../content/categories";
import { sfx, unlockAudio } from "../engine/feedback/audio";

// Each world portal gets its own planet hue.
const PLANET_HUES: Record<string, string> = {
  numberforge: "#ff8c42", melody: "#7c5cff", logic: "#ffd166", robot: "#9aa5b1", time: "#5cc8ff",
  cipher: "#3ddc97", builder: "#f4845f", living: "#6ee7b7", atlas: "#c084fc", flags: "#f87171",
  arabic: "#34d399", craft: "#a47551", wordwizard: "#fbbf24", body: "#fb7185", feelings: "#a78bfa",
  affix: "#22d3ee", grammar: "#f472b6", prepositions: "#4ade80", directions: "#38bdf8", physics: "#f97316",
  chemistry: "#a3e635", algebra: "#e879f9", placevalue: "#60a5fa", money: "#fcd34d", shapes: "#f472b6",
  measure: "#2dd4bf", primes: "#fb923c", binary: "#34d399", fractions: "#f9a8d4", elements: "#818cf8",
  space: "#8b5cf6", dinos: "#84cc16", weather: "#38bdf8", phonics: "#fb7185", idioms: "#f0abfc",
  manners: "#fca5a5", safety: "#fbbf24", helpers: "#60a5fa", animals: "#fb923c", green: "#4ade80",
  calendar: "#a78bfa", ocean: "#0ea5e9", garden: "#65a30d", nutrition: "#f87171", colors: "#e879f9",
  cultures: "#2dd4bf", transport: "#fb7185", moneysmarts: "#facc15", bugs: "#a3e635", machines: "#94a3b8",
  patterns: "#c084fc", synonyms: "#f472b6", punctuation: "#fbbf24", story: "#a78bfa", compare: "#38bdf8",
  data: "#34d399", roman: "#d4b483", rocks: "#a8a29e", habitats: "#facc15", town: "#60a5fa",
  instruments: "#fb7185", landforms: "#10b981", chef: "#f97316", riddles: "#818cf8", sports: "#4ade80",
  compounds: "#e879f9", birds: "#22c55e", thennow: "#d6a77a", ordinals: "#fcd34d", family: "#f9a8d4", pets: "#fdba74",
  trace: "#22d3ee", stars: "#fde047", ancient: "#d4a373", myths: "#c084fc", maps: "#d6a77a", homophones: "#5eead4",
  symmetry: "#f0abfc", chance: "#fb7185", signs: "#fbbf24", inventors: "#7dd3fc", calm: "#86efac",
};

type Progress = Record<string, { completed: boolean }>;
type Gates = Record<string, boolean>;

function WorldTile({ w, done, on, focused, fav, onOpen, onFav }: {
  w: WorldDef; done: number; on: boolean; focused: boolean; fav: boolean; onOpen: () => void; onFav: () => void;
}) {
  return (
    <div className="planet-wrap">
      <button
        className={`planet ${on ? "planet-open" : "planet-locked"} ${focused ? "planet-focus" : ""}`}
        disabled={!on}
        onClick={() => { unlockAudio(); onOpen(); }}
      >
        <span className="planet-ball" style={{ "--hue": PLANET_HUES[w.id] } as React.CSSProperties}>
          <span className="planet-icon">{w.icon}</span>
        </span>
        <span className="planet-name">{w.name}</span>
        <span className={`planet-chip ${!on || done === 0 ? "dim-chip" : ""}`}>
          {on ? `${done}/${w.stages.length}` : "🔒"}
        </span>
      </button>
      <button className={`planet-fav ${fav ? "is-fav" : ""}`} aria-label="favorite" onClick={onFav}>
        {fav ? "⭐" : "☆"}
      </button>
    </div>
  );
}

function MiniRow({ title, worlds, progress, gates, onOpen }: {
  title: string; worlds: WorldDef[]; progress: Progress; gates: Gates; onOpen: (w: WorldDef) => void;
}) {
  return (
    <div className="mini-row-block">
      <div className="mini-row-title">{title}</div>
      <div className="mini-row">
        {worlds.map((w) => {
          const on = Boolean(gates[w.id]);
          const done = completedInWorld(w, progress);
          return (
            <button key={w.id} className="mini-chip" disabled={!on} onClick={() => onOpen(w)}>
              <span className="mini-chip-icon">{w.icon}</span>
              <span className="mini-chip-name">{w.name}</span>
              <span className="mini-chip-sub">{on ? `${done}/${w.stages.length}` : "🔒"}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function WorldGrid() {
  const navigate = useNavigate();
  const progress = useGame((s) => s.progress);
  const enabledWorlds = useGame((s) => s.enabledWorlds);
  const hiddenWorlds = useGame((s) => s.hiddenWorlds);
  const recentWorlds = useGame((s) => s.recentWorlds);
  const favoriteWorlds = useGame((s) => s.favoriteWorlds);
  const toggleFavorite = useGame((s) => s.toggleFavorite);
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("all");

  const visible = WORLDS.filter((w) => !hiddenWorlds[w.id]);
  const focus = focusWorldIn(visible.filter((w) => enabledWorlds[w.id]), progress);
  const q = search.trim().toLowerCase();
  const filtering = q.length > 0 || cat !== "all";
  const filtered = visible.filter(
    (w) => (cat === "all" || categoryOf(w.id) === cat) &&
      (!q || w.name.toLowerCase().includes(q) || w.tagline.toLowerCase().includes(q)),
  );
  const pick = (ids: string[]) =>
    ids.map((id) => WORLDS.find((w) => w.id === id)).filter((w): w is WorldDef => !!w && !hiddenWorlds[w.id]);
  const recent = pick(recentWorlds);
  const favs = pick(favoriteWorlds);

  function open(w: WorldDef) {
    unlockAudio();
    sfx.tap();
    navigate(`/world/${w.id}`);
  }

  return (
    <section>
      <h2 className="section-title">🌌 Worlds <small className="worlds-count">{visible.length}</small></h2>

      <div className="world-search">
        <input
          className="world-search-input"
          placeholder="🔍 Search worlds…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && <button className="world-search-clear" aria-label="clear" onClick={() => setSearch("")}>✕</button>}
      </div>
      <div className="cat-chips">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            className={`cat-chip ${cat === c.key ? "cat-chip-on" : ""}`}
            onClick={() => { sfx.tap(); setCat(c.key); }}
          >
            {c.icon} {c.label}
          </button>
        ))}
      </div>

      {!filtering && recent.length > 0 && (
        <MiniRow title="▶ Recently played" worlds={recent} progress={progress} gates={enabledWorlds} onOpen={open} />
      )}
      {!filtering && favs.length > 0 && (
        <MiniRow title="⭐ Favorites" worlds={favs} progress={progress} gates={enabledWorlds} onOpen={open} />
      )}

      {filtered.length === 0 ? (
        <p className="dim">No worlds match — try another search or category.</p>
      ) : (
        <div className="planet-row planet-grid">
          {filtered.map((w) => (
            <WorldTile
              key={w.id}
              w={w}
              done={completedInWorld(w, progress)}
              on={Boolean(enabledWorlds[w.id])}
              focused={Boolean(focus && w.id === focus.id)}
              fav={favoriteWorlds.includes(w.id)}
              onOpen={() => open(w)}
              onFav={() => { sfx.tap(); toggleFavorite(w.id); }}
            />
          ))}
        </div>
      )}
    </section>
  );
}
