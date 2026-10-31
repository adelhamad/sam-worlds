import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { STR } from "../../strings/en";
import { duckMusic, unduckMusic } from "../../engine/feedback/music";
import { unlockAudio } from "../../engine/feedback/audio";
import { useGame } from "../../state/store";
import { RagdollScene, type CharacterKind, type ObjectKind, type RagdollTool } from "./RagdollScene";
import { advanceChallenge, challengeActions, firstStep, type ChallengeAction } from "./RagdollChallenges";
import { RagdollShow } from "./RagdollShow";
import "./RagdollGame.css";
import "./RagdollShow.css";

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
  { kind: "ball", label: copy.ball, icon: "●" },
  { kind: "bumper", label: copy.bumper, icon: "◉" },
  { kind: "launchpad", label: copy.launchpad, icon: "⏫" },
];
const tools: { key: MainTool; label: string; icon: string; hint: string }[] = [
  { key: "grab", label: copy.grab, icon: "✋", hint: copy.grabHint },
  { key: "kick", label: copy.kick, icon: "⚡", hint: copy.kickHint },
  { key: "move", label: copy.move, icon: "✥", hint: copy.moveHint },
  { key: "delete", label: copy.delete, icon: "⌫", hint: copy.deleteHint },
];

function suggestedCharacter(stage: number): CharacterKind {
  if (stage === 2) return "pineapple";
  if (stage === 6) return "watermelon";
  return "red";
}

function partyAvailable(mode: "show" | "free", stage: number, step: number, menuOpen: boolean): boolean {
  return !menuOpen && (mode === "free" || (stage === 6 && step > 0));
}

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
  const completedShows = useGame((state) => state.ragdollShowsCompleted);
  const soundOn = useGame((state) => state.soundOn);
  const toggleSound = useGame((state) => state.toggleSound);
  const sceneRef = useRef<RagdollScene | null>(null);
  const resetButtonRef = useRef<HTMLButtonElement>(null);
  const showButtonRef = useRef<HTMLButtonElement>(null);
  const resetDialogRef = useRef<HTMLDivElement>(null);
  const [tool, setTool] = useState<RagdollTool>("kick");
  const [palette, setPalette] = useState<Palette>(null);
  const [paused, setPaused] = useState(false);
  const [slowMo, setSlowMo] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState(false);
  const [wearingGlasses, setWearingGlasses] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [showMenuOpen, setShowMenuOpen] = useState(false);
  const [mode, setMode] = useState<"show" | "free">("show");
  const modeRef = useRef<"show" | "free">("show");
  const challengeRef = useRef(firstStep(0));
  const [challenge, setChallenge] = useState(firstStep(0));
  const [cheer, setCheer] = useState("");
  const cheerTimeout = useRef<number | undefined>(undefined);
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
        if (event.character) {
          setSelectedCharacter(false);
          setWearingGlasses(false);
        }
      }
      if (modeRef.current === "show") {
        const result = advanceChallenge(challengeRef.current, event);
        if (result.progress !== challengeRef.current) {
          challengeRef.current = result.progress;
          setChallenge(result.progress);
        }
        if (result.advanced) {
          sceneRef.current?.celebrate();
          if (result.finishedStage) useGame.getState().completeRagdollShow(result.progress.stage);
          const line = copy.cheer[(result.progress.stage + result.progress.step) % copy.cheer.length];
          setCheer(line);
          window.clearTimeout(cheerTimeout.current);
          cheerTimeout.current = window.setTimeout(() => setCheer(""), 1800);
        }
      }
    });
    sceneRef.current = scene;
    scene.setTool("kick");
    return () => {
      sceneRef.current = null;
      scene.dispose();
      unduckMusic();
      window.clearTimeout(cheerTimeout.current);
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

  useEffect(() => { sceneRef.current?.setMuted(!soundOn); }, [soundOn]);

  useEffect(() => {
    if (!showMenuOpen) return;
    const dialog = document.querySelector<HTMLElement>(".ragdoll-show-menu");
    const showButton = showButtonRef.current;
    dialog?.querySelector<HTMLButtonElement>("button")?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setShowMenuOpen(false); return; }
      if (event.key !== "Tab" || !dialog) return;
      const buttons = Array.from(dialog.querySelectorAll<HTMLButtonElement>("button"));
      const first = buttons[0], last = buttons.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => { window.removeEventListener("keydown", onKeyDown); showButton?.focus(); };
  }, [showMenuOpen]);

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

  function startStage(index: number) {
    const next = firstStep(index);
    challengeRef.current = next;
    setChallenge(next);
    modeRef.current = "show";
    setMode("show");
    setShowMenuOpen(false);
    setHelpOpen(false);
    setCheer("");
    setPaused(false);
    sceneRef.current?.setPaused(false);
    setSlowMo(false);
    sceneRef.current?.setSlowMotion(false);
    sceneRef.current?.loadShow(index);
    activateForStep(challengeActions[index][0], index);
  }

  function freePlay() {
    modeRef.current = "free";
    setMode("free");
    setShowMenuOpen(false);
    setCheer("");
    sceneRef.current?.setGuideVisible(false);
  }

  function challengeAction(action: ChallengeAction) {
    if (action === "characters") {
      chooseCharacter(suggestedCharacter(challenge.stage));
      setPalette("characters");
    } else if (action === "objects") {
      chooseObject("ball");
      setPalette("objects");
    } else if (action === "glasses") {
      if (selectedCharacter) sceneRef.current?.toggleGlasses();
      else chooseTool("grab");
    } else if (action === "party") {
      unlockAudio();
      sceneRef.current?.partyBlast();
    } else chooseTool(action);
  }

  function activateForStep(action: ChallengeAction, stage: number) {
    if (action === "characters") {
      chooseCharacter(suggestedCharacter(stage));
      setPalette("characters");
    } else if (action === "objects") {
      chooseObject("ball");
      setPalette("objects");
    } else if (action !== "glasses" && action !== "party") chooseTool(action);
  }

  function togglePause() {
    const next = !paused;
    setPaused(next);
    sceneRef.current?.setPaused(next);
  }

  function toggleMute() {
    unlockAudio();
    toggleSound();
  }

  function toggleSlowMo() {
    const next = !slowMo;
    setSlowMo(next);
    sceneRef.current?.setSlowMotion(next);
  }

  function resetPlayground() {
    if (mode === "show") {
      const next = firstStep(challenge.stage);
      challengeRef.current = next;
      setChallenge(next);
      sceneRef.current?.loadShow(challenge.stage);
    } else sceneRef.current?.reset();
    sceneRef.current?.setTool(mode === "show" ? "kick" : "grab");
    setTool(mode === "show" ? "kick" : "grab");
    setPalette(null);
    setSelectedCharacter(false);
    setWearingGlasses(false);
    setPaused(false);
    sceneRef.current?.setPaused(false);
    setSlowMo(false);
    sceneRef.current?.setSlowMotion(false);
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
          <button type="button" ref={showButtonRef} className="ragdoll-circle" onClick={() => { setShowMenuOpen(true); setHelpOpen(false); }} aria-label={copy.showMenu} title={copy.showMenu}>★</button>
          <button type="button" className="ragdoll-circle" onClick={() => setHelpOpen((value) => !value)} aria-label={copy.howToPlay} aria-expanded={helpOpen}>?</button>
          <button type="button" className="ragdoll-circle" onClick={toggleMute} aria-label={soundOn ? copy.mute : copy.unmute} title={soundOn ? copy.mute : copy.unmute}>{soundOn ? "♫" : "♪̸"}</button>
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

      <RagdollShow progress={challenge} completed={completedShows} mode={mode} menuOpen={showMenuOpen} cheer={cheer} onAction={challengeAction} onStage={startStage} onFree={freePlay} onMenuClose={() => setShowMenuOpen(false)} />

      <div className="ragdoll-controls">
        {partyAvailable(mode, challenge.stage, challenge.step, showMenuOpen) && <button type="button" className="ragdoll-party-button" onClick={() => { unlockAudio(); sceneRef.current?.partyBlast(); }} disabled={paused} title={copy.partyHint}><span aria-hidden="true">✦</span> {copy.party}</button>}
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
            <button type="button" className={`ragdoll-dock-button ${slowMo ? "is-active" : ""}`} onClick={toggleSlowMo} aria-pressed={slowMo}><span className="ragdoll-tool-icon" aria-hidden="true">◴</span><span>{slowMo ? copy.normalSpeed : copy.slowMo}</span></button>
            <button type="button" className="ragdoll-dock-button" onClick={togglePause} aria-pressed={paused}><span className="ragdoll-tool-icon" aria-hidden="true">{paused ? "▶" : "Ⅱ"}</span><span>{paused ? copy.play : copy.pause}</span></button>
            <button type="button" ref={resetButtonRef} className="ragdoll-dock-button ragdoll-dock-button--reset" onClick={() => setResetOpen(true)}><span className="ragdoll-tool-icon" aria-hidden="true">↺</span><span>{copy.reset}</span></button>
          </div>
        </nav>
      </div>

      {resetOpen && <div className="ragdoll-modal-backdrop" role="presentation"><div ref={resetDialogRef} className="ragdoll-modal" role="alertdialog" aria-modal="true" aria-labelledby="ragdoll-reset-title" aria-describedby="ragdoll-reset-body"><div className="ragdoll-modal-symbol" aria-hidden="true">↺</div><h2 id="ragdoll-reset-title">{copy.resetTitle}</h2><p id="ragdoll-reset-body">{copy.resetBody}</p><div className="ragdoll-modal-actions"><button type="button" className="ragdoll-modal-cancel" onClick={() => setResetOpen(false)}>{copy.cancel}</button><button type="button" className="ragdoll-modal-confirm" onClick={resetPlayground}>{copy.confirmReset}</button></div></div></div>}
    </main>
  );
}
