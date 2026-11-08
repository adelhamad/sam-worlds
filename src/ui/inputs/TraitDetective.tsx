import { useId, useState } from "react";
import type { Question } from "../../engine/generators/types";
import { detectiveAnswer } from "../../content/traits/detectiveTypes";
import type { DetectiveBoard, DetectiveTile, DetectiveZone, HabitatCase } from "../../content/traits/detectiveTypes";
import { TRAIT_PHOTOS } from "../../content/traits/photoCatalog";
import { speak, speechSupported } from "../../engine/feedback/speech";
import { detectiveStrings as text } from "../../strings/traitDetective";
import "../traitDetective.css";

interface Props {
  question: Question;
  disabled: boolean;
  onSubmit: (value: string) => void;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function hasStrings(value: unknown, keys: string[]): boolean {
  return isRecord(value) && keys.every((key) => typeof value[key] === "string");
}

function validHabitat(value: unknown): boolean {
  if (!isRecord(value) || !hasStrings(value, ["id", "subject", "photo", "trait"])) return false;
  return Array.isArray(value.scenes) && value.scenes.length === 2
    && value.scenes.every((scene) => hasStrings(scene, ["id", "place", "observation"]));
}

function validBoard(value: unknown): value is DetectiveBoard {
  if (!isRecord(value) || !hasStrings(value, ["mode", "title", "instruction", "reminder"])) return false;
  if (!["notice", "sort", "origins", "compare", "connect"].includes(value.mode as string)) return false;
  if (!Array.isArray(value.cards) || !value.cards.length
    || !value.cards.every((card) => hasStrings(card, ["id", "title", "clue"]))) return false;
  if (!Array.isArray(value.zones) || !value.zones.length
    || !value.zones.every((zone) => hasStrings(zone, ["id", "title", "description"]))) return false;
  if (value.mode === "connect") return hasStrings(value.claim, ["title", "photo", "clue"]);
  if (value.mode !== "compare") return true;
  return Array.isArray(value.habitats) && value.habitats.length === 2 && value.habitats.every(validHabitat);
}

function Photo({ photo }: { photo?: string }) {
  const image = photo ? TRAIT_PHOTOS[photo] : undefined;
  return image ? <img src={image.src} alt={image.alt} width={88} height={88} /> : null;
}

function Listen({ words, label = text.listen }: { words: string; label?: string }) {
  if (!speechSupported()) return null;
  return <button type="button" className="td-listen" aria-label={label} onClick={() => speak(words)}>
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M11 5 6 9H3v6h3l5 4V5Z" /><path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" />
    </svg>
    <span>{text.listen}</span>
  </button>;
}

interface ClueProps {
  card: DetectiveTile;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
  destinations: DetectiveZone[];
  onPlace: (zone: DetectiveZone) => void;
}

function InlineDestinations({ zones, disabled, onPlace }: {
  zones: DetectiveZone[]; disabled: boolean; onPlace: (zone: DetectiveZone) => void;
}) {
  return <div className="td-inline-destinations" role="group" aria-label={text.choosePlace}>
    <strong>{text.choosePlace}</strong>
    {zones.map((zone) => <button type="button" key={zone.id} disabled={disabled} onClick={() => onPlace(zone)}>
      {zone.group === "traits" && <span className="td-inline-membership">{text.insideTraits}</span>}
      <strong>{zone.title}</strong><span>{zone.description}</span>
    </button>)}
  </div>;
}

function Clue({ card, selected, disabled, onSelect, destinations, onPlace }: ClueProps) {
  return <div className="td-clue">
    <button type="button" className="td-clue-pick" aria-pressed={selected} disabled={disabled} onClick={onSelect}>
      <Photo photo={card.photo} />
      <span className="td-clue-copy"><strong>{card.title}</strong><span>{card.clue}</span></span>
    </button>
    <Listen words={`${card.title}. ${card.clue}`} label={text.listenClue(card.title)} />
    {selected && <InlineDestinations zones={destinations} disabled={disabled} onPlace={onPlace} />}
  </div>;
}

interface HabitatProps {
  habitat: HabitatCase;
  visited: Set<string>;
  disabled: boolean;
  onVisit: (id: string) => void;
}

function Habitat({ habitat, visited, disabled, onVisit }: HabitatProps) {
  const [sceneId, setSceneId] = useState(habitat.scenes[0].id);
  const panelId = useId();
  const scene = habitat.scenes.find((item) => item.id === sceneId) ?? habitat.scenes[0];
  const explored = habitat.scenes.every((item) => visited.has(`${habitat.id}-${item.id}`));
  return <section className="td-habitat" aria-label={habitat.subject}>
    <h3>{habitat.subject}</h3>
    <p className="td-explore">{explored ? text.explored : text.explore}</p>
    <div className="td-places" role="group" aria-label={`${habitat.subject}: ${text.explore}`}>
      {habitat.scenes.map((item) => <button type="button" key={item.id} aria-pressed={scene.id === item.id}
        aria-controls={panelId} disabled={disabled} onClick={() => { setSceneId(item.id); onVisit(`${habitat.id}-${item.id}`); }}>
        {item.place}{visited.has(`${habitat.id}-${item.id}`) && <span className="td-seen">{text.seen}</span>}
      </button>)}
    </div>
    <div id={panelId} className="td-scene">
      <div className="td-same-trait"><Photo photo={habitat.photo} /><strong>{habitat.trait}</strong></div>
      <p className="td-unchanged">{text.unchanged}</p>
      <div aria-live="polite" aria-atomic="true"><strong>{scene.place}</strong><p>{scene.observation}</p></div>
      <Listen words={`${habitat.subject}. ${habitat.trait}. ${text.unchanged} ${scene.place}. ${scene.observation}`} />
    </div>
  </section>;
}

type Stamps = { trait: boolean; adaptation: boolean };
const EMPTY_STAMPS: Stamps = { trait: false, adaptation: false };

function Claim({ claim }: { claim: DetectiveBoard["claim"] }) {
  if (!claim) return null;
  return <section className="td-claim" aria-label={claim.title}>
    <Photo photo={claim.photo} />
    <div><h3>{claim.title}</h3><p>{claim.clue}</p>
      <Listen words={`${claim.title}. ${claim.clue}. ${text.buildProof}`} />
    </div>
  </section>;
}

function LabelStamps({ stamps, disabled, onToggle }: {
  stamps: Stamps; disabled: boolean; onToggle: (stamp: keyof Stamps) => void;
}) {
  const helpId = useId();
  return <fieldset className="td-stamps" aria-describedby={helpId}>
    <legend>{text.labels}</legend>
    <p id={helpId}>{text.labelHelp}</p>
    <div className="td-stamp-buttons">
      <button type="button" aria-pressed={stamps.trait} disabled={disabled} onClick={() => onToggle("trait")}>{text.traitLabel}</button>
      <button type="button" aria-pressed={stamps.adaptation} disabled={disabled} onClick={() => onToggle("adaptation")}>{text.adaptationLabel}</button>
    </div>
    <Listen words={`${text.labels} ${text.labelHelp} ${text.traitLabel}. ${text.adaptationLabel}.`} />
  </fieldset>;
}

function submissionAnswer(board: DetectiveBoard, placements: Record<string, string>, stamps: Stamps) {
  if (board.mode !== "connect") return detectiveAnswer(placements);
  return detectiveAnswer({ ...placements,
    "stamp-trait": stamps.trait ? "yes" : "no",
    "stamp-adaptation": stamps.adaptation ? "yes" : "no",
  });
}

function DetectiveDesk({ board, disabled, onSubmit }: { board: DetectiveBoard } & Omit<Props, "question">) {
  const [placements, setPlacements] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [stamps, setStamps] = useState<Stamps>(EMPTY_STAMPS);
  const connecting = board.mode === "connect";
  const hasStamp = Object.values(stamps).some(Boolean);
  const labelsReady = !connecting || hasStamp;
  const habitats = board.mode === "compare" ? board.habitats ?? [] : [];
  const [visited, setVisited] = useState(() => new Set(habitats.map((item) => `${item.id}-${item.scenes[0].id}`)));
  const instructionId = useId();
  const allExplored = habitats.every((item) => item.scenes.every((scene) => visited.has(`${item.id}-${scene.id}`)));
  const count = board.cards.filter((card) => placements[card.id]).length;
  const ready = count === board.cards.length && allExplored && labelsReady;

  function clear() {
    setPlacements({});
    setSelected(null);
    setStamps(EMPTY_STAMPS);
    setAnnouncement(connecting ? text.evidenceCleared : text.cleared);
  }

  function select(card: DetectiveTile) {
    if (disabled) return;
    setSelected(card.id);
    setAnnouncement(text.selected(card.title));
  }

  function place(zone: DetectiveZone) {
    if (disabled || !selected) return;
    const card = board.cards.find((item) => item.id === selected);
    if (!card) return;
    setPlacements((current) => ({ ...current, [card.id]: zone.id }));
    setSelected(null);
    setAnnouncement(text.placed(card.title, zone.title));
  }

  function renderClue(card: DetectiveTile) {
    return <Clue key={card.id} card={card} selected={selected === card.id} disabled={disabled}
      onSelect={() => select(card)} destinations={zones} onPlace={place} />;
  }

  function renderZone(zone: DetectiveZone) {
    const cards = board.cards.filter((card) => placements[card.id] === zone.id);
    return <section className="td-zone" key={zone.id} aria-label={zone.title}>
      <button type="button" className="td-destination" disabled={disabled || !selected}
        onClick={() => place(zone)} aria-label={text.place(zone.title)}>
        <strong>{zone.title}</strong><span>{zone.description}</span>
      </button>
      <div className="td-zone-clues">{cards.length ? cards.map(renderClue) : <p className="td-empty">{text.empty}</p>}</div>
    </section>;
  }

  const zones = board.zones.map((zone) => {
    if (board.mode !== "sort") return zone;
    if (zone.id === "unknown") return { ...zone, title: text.unknown };
    if (zone.id === "adaptation") return { ...zone, title: text.adaptation };
    return zone;
  });
  const grouped = board.mode === "sort" ? zones.filter((zone) => zone.group === "traits") : [];
  const separate = zones.filter((zone) => !grouped.includes(zone));
  return <div className="trait-detective" aria-describedby={instructionId}>
    <header className="td-heading"><div><h2>{text.title}</h2><h3>{board.title}</h3></div>
      <Listen words={`${board.title}. ${board.instruction}. ${text.choose} ${board.mode === "sort" ? text.reminder : board.reminder}`} />
    </header>
    <p id={instructionId} className="td-instruction">{board.instruction}</p>
    {connecting && <Claim claim={board.claim} />}
    {habitats.length > 0 && <><p className="td-model">{text.model}</p><div className="td-habitats">
      {habitats.map((habitat) => <Habitat key={habitat.id} habitat={habitat} visited={visited} disabled={disabled}
        onVisit={(id) => setVisited((current) => new Set([...current, id]))} />)}
    </div></>}
    <div className="td-sort-help"><strong>{text.choose}</strong><span>{text.move}</span></div>
    <section className="td-tray" aria-label={text.clues}>
      <div className="td-tray-heading"><h3>{text.clues}</h3><span>{text.progress(count, board.cards.length)}</span></div>
      <div className="td-clues">{board.cards.filter((card) => !placements[card.id]).map(renderClue)}</div>
      {count === board.cards.length && <p>{text.allPlaced}</p>}
    </section>
    <p className="td-selection" role="status" aria-live="polite" aria-atomic="true">{announcement}</p>
    <div className={`td-destinations${grouped.length ? " td-nested" : ""}`}>
      {grouped.length > 0 && <fieldset className="td-traits"><legend>{text.traits}</legend>
        <p>{text.reminder}</p><div className="td-traits-zones">{grouped.map(renderZone)}</div>
      </fieldset>}
      {separate.map(renderZone)}
    </div>
    {board.mode !== "sort" && board.reminder && <p className="td-reminder">{board.reminder}</p>}
    {connecting && <LabelStamps stamps={stamps} disabled={disabled}
      onToggle={(stamp) => { if (!disabled) setStamps((current) => ({ ...current, [stamp]: !current[stamp] })); }} />}
    <footer className="td-footer">
      <p>{text.progress(count, board.cards.length)}{!allExplored && <span>{text.exploreFirst}</span>}</p>
      {!labelsReady && <p>{text.chooseLabel}</p>}
      <div className="td-actions"><button type="button" className="btn btn-secondary" disabled={disabled || (!count && !selected && !hasStamp)}
        onClick={clear}>{connecting ? text.clearEvidence : text.reset}</button>
        <button type="button" className="btn btn-primary" disabled={disabled || !ready}
          onClick={() => { if (ready && !disabled) onSubmit(submissionAnswer(board, placements, stamps)); }}>{text.check}</button></div>
    </footer>
  </div>;
}

export function TraitDetective({ question, disabled, onSubmit }: Props) {
  const board = question.payload?.traitDetective;
  if (!validBoard(board)) return null;
  return <DetectiveDesk key={question.id} board={board} disabled={disabled} onSubmit={onSubmit} />;
}
