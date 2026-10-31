import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { STR } from "../../strings/en";
import { duckMusic, unduckMusic } from "../../engine/feedback/music";
import { unlockAudio } from "../../engine/feedback/audio";
import { RagdollScene, type CharacterKind, type ObjectKind, type RagdollTool } from "./RagdollScene";
import "./RagdollGame.css";

type Palette = "characters" | "objects" | null;
type MainTool = Extract<RagdollTool, "grab" | "kick" | "move" | "delete">;

const copy = STR.ragdoll;
const characters: { kind: CharacterKind; label: string }[] = [
  { kind: "classic", label: copy.classic },
  { kind: "red", label: copy.red },
  { kind: "green", label: copy.green },
  { kind: "yellow", label: copy.yellow },
  { kind: "pineapple", label: copy.pineapple },
  { kind: "watermelon", label: copy.watermelon },
];
const objects: { kind: ObjectKind; label: string; icon: string }[] = [
  { kind: "crate", label: copy.crate, icon: "▣" },
  { kind: "spikes", label: copy.spikes, icon: "▲" },
];
const tools: { key: MainTool; label: string; icon: string; hint: string }[] = [
  { key: "grab", label: copy.grab, icon: "✋", hint: copy.grabHint },
  { key: "kick", label: copy.kick, icon: "⚡", hint: copy.kickHint },
  { key: "move", label: copy.move, icon: "✥", hint: copy.moveHint },
  { key: "delete", label: copy.delete, icon: "⌫", hint: copy.deleteHint },
];

function CharacterPreview({ kind }: { kind: CharacterKind }) {
  return (
    <span className={`ragdoll-mini ragdoll-mini--${kind}`} aria-hidden="true">
      <span className="ragdoll-mini-head">
        <i className="ragdoll-mini-eye" />
        <i className="ragdoll-mini-eye" />
      </span>
      <span className="ragdoll-mini-body" />
      <span className="ragdoll-mini-arm ragdoll-mini-arm--left" />
      <span className="ragdoll-mini-arm ragdoll-mini-arm--right" />
      <span className="ragdoll-mini-leg ragdoll-mini-leg--left" />
      <span className="ragdoll-mini-leg ragdoll-mini-leg--right" />
    </span>
  );
}

export function RagdollGame() {
  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<RagdollScene | null>(null);
  const resetButtonRef = useRef<HTMLButtonElement>(null);
  const resetDialogRef = useRef<HTMLDivElement>(null);
  const [tool, setTool] = useState<RagdollTool>("grab");
  const [palette, setPalette] = useState<Palette>(null);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState(false);
  const [wearingGlasses, setWearingGlasses] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(true);
  const [selectedSkin, setSelectedSkin] = useState<CharacterKind>("classic");
  const [selectedObject, setSelectedObject] = useState<ObjectKind>("crate");

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    duckMusic();
    const scene = new RagdollScene(host, (event) => {
      if (event.type === "select") {
        setSelectedCharacter(Boolean(event.character));
        setWearingGlasses(Boolean(event.glasses));
      }
      if (event.type === "delete" || event.type === "defeat") {
        setSelectedCharacter(false);
        setWearingGlasses(false);
      }
    });
    sceneRef.current = scene;
    scene.setTool("grab");
    return () => {
      sceneRef.current = null;
      scene.dispose();
      unduckMusic();
    };
  }, []);

  useEffect(() => {
    if (!resetOpen) return;
    const dialog = resetDialogRef.current;
    const resetButton = resetButtonRef.current;
    const firstButton = dialog?.querySelector<HTMLButtonElement>("button");
    firstButton?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setResetOpen(false);
        return;
      }
      if (event.key !== "Tab" || !dialog) return;
      const buttons = Array.from(dialog.querySelectorAll<HTMLButtonElement>("button"));
      const first = buttons[0];
      const last = buttons.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      resetButton?.focus();
    };
  }, [resetOpen]);

  function chooseTool(next: MainTool) {
    unlockAudio();
    setTool(next);
    setPalette(null);
    sceneRef.current?.setTool(next);
  }

  function chooseCharacter(kind: CharacterKind) {
    unlockAudio();
    setSelectedSkin(kind);
    setTool("place-character");
    sceneRef.current?.setCharacter(kind);
  }

  function chooseObject(kind: ObjectKind) {
    unlockAudio();
    setSelectedObject(kind);
    setTool("place-object");
    sceneRef.current?.setObject(kind);
  }

  function togglePause() {
    const next = !paused;
    setPaused(next);
    sceneRef.current?.setPaused(next);
  }

  function toggleMute() {
    const next = !muted;
    setMuted(next);
    sceneRef.current?.setMuted(next);
  }

  function resetPlayground() {
    sceneRef.current?.reset();
    sceneRef.current?.setTool("grab");
    setTool("grab");
    setPalette(null);
    setSelectedCharacter(false);
    setWearingGlasses(false);
    setPaused(false);
    sceneRef.current?.setPaused(false);
    setResetOpen(false);
  }

  let hint = tools.find((item) => item.key === tool)?.hint ?? copy.cameraHint;
  if (tool === "place-character") hint = copy.characterHint;
  if (tool === "place-object") hint = copy.objectHint;
  if (paused) hint = copy.pausedHint;

  return (
    <main className="ragdoll-game" aria-label={copy.title}>
      <div className="ragdoll-stage" ref={hostRef} role="region" aria-label={copy.title} aria-describedby="ragdoll-stage-instructions" />
      <p className="ragdoll-sr-only" id="ragdoll-stage-instructions">{copy.cameraHint}</p>
      <div className="ragdoll-sky-wash" aria-hidden="true" />

      <header className="ragdoll-topbar">
        <Link className="ragdoll-back" to="/hub" aria-label={copy.back}>{copy.back}</Link>
        <div className="ragdoll-heading">
          <span className="ragdoll-heading-icon" aria-hidden="true">✦</span>
          <h1>{copy.title}</h1>
        </div>
        <div className="ragdoll-top-actions">
          <button type="button" className="ragdoll-circle" onClick={() => setHelpOpen((value) => !value)} aria-label={copy.howToPlay} aria-expanded={helpOpen}>?</button>
          <button type="button" className="ragdoll-circle" onClick={toggleMute} aria-label={muted ? copy.unmute : copy.mute} title={muted ? copy.unmute : copy.mute}>{muted ? "♪̸" : "♫"}</button>
        </div>
      </header>

      {helpOpen && (
        <aside className="ragdoll-help">
          <div className="ragdoll-help-title"><strong>{copy.howToPlay}</strong><button type="button" onClick={() => setHelpOpen(false)} aria-label={copy.close}>×</button></div>
          <p>{copy.cameraHint}</p>
          <p>{copy.grabHint}</p>
          <p>{copy.kickHint}</p>
        </aside>
      )}

      <div className="ragdoll-controls">
        <div className="ragdoll-hint" role="status"><span aria-hidden="true">✦</span>{hint}</div>
        {palette && (
          <section className="ragdoll-palette" aria-label={palette === "characters" ? copy.characters : copy.objects}>
            <div className="ragdoll-palette-heading"><strong>{palette === "characters" ? copy.characters : copy.objects}</strong><span>{palette === "characters" ? copy.characterHint : copy.objectHint}</span></div>
            <div className="ragdoll-palette-options">
              {palette === "characters"
                ? characters.map(({ kind, label }) => (
                    <button type="button" key={kind} className={`ragdoll-choice ${tool === "place-character" && selectedSkin === kind ? "is-active" : ""}`} onClick={() => chooseCharacter(kind)} aria-pressed={tool === "place-character" && selectedSkin === kind}>
                      <CharacterPreview kind={kind} /><span>{label}</span>
                    </button>
                  ))
                : objects.map(({ kind, label, icon }) => (
                    <button type="button" key={kind} className={`ragdoll-choice ragdoll-choice--object ${tool === "place-object" && selectedObject === kind ? "is-active" : ""}`} onClick={() => chooseObject(kind)} aria-pressed={tool === "place-object" && selectedObject === kind}>
                      <span className={`ragdoll-object-icon ragdoll-object-icon--${kind}`} aria-hidden="true">{icon}</span><span>{label}</span>
                    </button>
                  ))}
            </div>
          </section>
        )}
        <nav className="ragdoll-dock" aria-label={copy.tools}>
          <div className="ragdoll-dock-group ragdoll-dock-group--add">
            <button type="button" className={`ragdoll-dock-button ragdoll-dock-button--add ${palette === "characters" ? "is-active" : ""}`} onClick={() => setPalette((value) => value === "characters" ? null : "characters")} aria-expanded={palette === "characters"}><span className="ragdoll-tool-icon">☺</span><span>{copy.characters}</span></button>
            <button type="button" className={`ragdoll-dock-button ragdoll-dock-button--add ${palette === "objects" ? "is-active" : ""}`} onClick={() => setPalette((value) => value === "objects" ? null : "objects")} aria-expanded={palette === "objects"}><span className="ragdoll-tool-icon">▧</span><span>{copy.objects}</span></button>
          </div>
          <span className="ragdoll-dock-divider" aria-hidden="true" />
          <div className="ragdoll-dock-group ragdoll-dock-group--tools">
            {tools.map((item) => <button type="button" key={item.key} className={`ragdoll-dock-button ${tool === item.key ? "is-active" : ""}`} onClick={() => chooseTool(item.key)} aria-pressed={tool === item.key} title={item.hint}><span className="ragdoll-tool-icon" aria-hidden="true">{item.icon}</span><span>{item.label}</span></button>)}
          </div>
          <span className="ragdoll-dock-divider" aria-hidden="true" />
          <div className="ragdoll-dock-group ragdoll-dock-group--actions">
            <button type="button" className={`ragdoll-dock-button ${wearingGlasses ? "is-active" : ""}`} onClick={() => { sceneRef.current?.toggleGlasses(); setWearingGlasses((value) => !value); }} disabled={!selectedCharacter} aria-pressed={wearingGlasses} title={selectedCharacter ? copy.glasses : copy.glassHint}><span className="ragdoll-tool-icon" aria-hidden="true">◉</span><span>{copy.glasses}</span></button>
            <button type="button" className="ragdoll-dock-button" onClick={togglePause} aria-pressed={paused}><span className="ragdoll-tool-icon" aria-hidden="true">{paused ? "▶" : "Ⅱ"}</span><span>{paused ? copy.play : copy.pause}</span></button>
            <button type="button" ref={resetButtonRef} className="ragdoll-dock-button ragdoll-dock-button--reset" onClick={() => setResetOpen(true)}><span className="ragdoll-tool-icon" aria-hidden="true">↺</span><span>{copy.reset}</span></button>
          </div>
        </nav>
      </div>

      {resetOpen && <div className="ragdoll-modal-backdrop" role="presentation"><div ref={resetDialogRef} className="ragdoll-modal" role="alertdialog" aria-modal="true" aria-labelledby="ragdoll-reset-title" aria-describedby="ragdoll-reset-body"><div className="ragdoll-modal-symbol" aria-hidden="true">↺</div><h2 id="ragdoll-reset-title">{copy.resetTitle}</h2><p id="ragdoll-reset-body">{copy.resetBody}</p><div className="ragdoll-modal-actions"><button type="button" className="ragdoll-modal-cancel" onClick={() => setResetOpen(false)}>{copy.cancel}</button><button type="button" className="ragdoll-modal-confirm" onClick={resetPlayground}>{copy.confirmReset}</button></div></div></div>}
    </main>
  );
}
