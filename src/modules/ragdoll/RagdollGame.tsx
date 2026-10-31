import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { STR } from "../../strings/en";
import { duckMusic, unduckMusic } from "../../engine/feedback/music";
import { unlockAudio } from "../../engine/feedback/audio";
import { useGame } from "../../state/store";
import { RagdollScene, type CharacterKind, type ObjectKind, type RagdollTool } from "./RagdollScene";
import { advanceChallenge, challengeActions, firstStep, type ChallengeAction } from "./RagdollChallenges";
import { RagdollShow } from "./RagdollShow";
import { RagdollRecorder } from "./RagdollRecorder";
import { RagdollIcon } from "./RagdollIcon";
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
const objects: { kind: ObjectKind; label: string }[] = [
  { kind: "crate", label: copy.crate },
  { kind: "spikes", label: copy.spikes },
  { kind: "ball", label: copy.ball },
  { kind: "bumper", label: copy.bumper },
  { kind: "launchpad", label: copy.launchpad },
  { kind: "fan", label: copy.fan },
];
const tools: { key: MainTool; label: string; hint: string }[] = [
  { key: "grab", label: copy.grab, hint: copy.grabHint },
  { key: "kick", label: copy.kick, hint: copy.kickHint },
  { key: "move", label: copy.move, hint: copy.moveHint },
  { key: "delete", label: copy.delete, hint: copy.deleteHint },
];

function controlHint(tool: RagdollTool, paused: boolean) {
  if (paused) return copy.pausedHint;
  if (tool === "place-character") return copy.characterHint;
  if (tool === "place-object") return copy.objectHint;
  return tools.find((item) => item.key === tool)?.hint ?? copy.cameraHint;
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
  const [showMenuOpen, setShowMenuOpen] = useState(true);
  const [mode, setMode] = useState<"show" | "free">("show");
  const modeRef = useRef<"show" | "free">("show");
  const challengeRef = useRef(firstStep(0));
  const [challenge, setChallenge] = useState(firstStep(0));
  const [cheer, setCheer] = useState("");
  const cheerTimeout = useRef<number | undefined>(undefined);
  const [selectedSkin, setSelectedSkin] = useState<CharacterKind>("classic");
  const [selectedObject, setSelectedObject] = useState<ObjectKind>("crate");

  const activateForStep = useCallback((action: ChallengeAction) => {
    setSlowMo(false);
    sceneRef.current?.setSlowMotion(false);
    setPalette(null);
    if (action === "party") return;
    setTool(action);
    sceneRef.current?.setTool(action);
  }, []);

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
          else queueMicrotask(() => {
            if (modeRef.current === "show" && challengeRef.current === result.progress)
              activateForStep(challengeActions[result.progress.stage][result.progress.step]);
          });
          const line = copy.feedback[event.type as keyof typeof copy.feedback] ?? "Stage cleared!";
          setCheer(line);
          window.clearTimeout(cheerTimeout.current);
          cheerTimeout.current = window.setTimeout(() => setCheer(""), 1800);
        }
      }
    });
    sceneRef.current = scene;
    scene.setTool("kick");
    scene.loadShow(0);
    return () => {
      sceneRef.current = null;
      scene.dispose();
      unduckMusic();
      window.clearTimeout(cheerTimeout.current);
    };
  }, [activateForStep]);

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
    activateForStep(challengeActions[index][0]);
  }

  function freePlay() {
    modeRef.current = "free";
    setMode("free");
    setShowMenuOpen(false);
    setCheer("");
    sceneRef.current?.enterFreePlay();
    setTool("grab");
    setPalette(null);
    sceneRef.current?.setTool("grab");
    setPaused(false);
    sceneRef.current?.setPaused(false);
    setSlowMo(false);
    sceneRef.current?.setSlowMotion(false);
  }

  function challengeAction(action: ChallengeAction) {
    if (action === "party") {
      unlockAudio();
      sceneRef.current?.partyBlast();
    } else chooseTool(action);
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
    if (mode === "show") activateForStep(challengeActions[challenge.stage][0]);
    setResetOpen(false);
  }

  const hint = controlHint(tool, paused);

  return (
    <main className="ragdoll-game" aria-label={copy.title}>
      <div className="ragdoll-stage" ref={hostRef} role="region" aria-label={copy.title} aria-describedby="ragdoll-stage-instructions" />
      <p className="ragdoll-sr-only" id="ragdoll-stage-instructions">{copy.cameraHint}</p>
      <div className="ragdoll-sky-wash" aria-hidden="true" />

      <header className="ragdoll-topbar">
        <Link className="ragdoll-back" to="/hub" aria-label={copy.back}>{copy.back}</Link>
        <div className="ragdoll-heading">
          <img className="ragdoll-heading-icon" src="/ragdoll/fruit-friends.png" alt="" />
          <h1>{copy.title}</h1>
        </div>
        <div className="ragdoll-top-actions">
          <button type="button" ref={showButtonRef} className="ragdoll-circle" onClick={() => { setShowMenuOpen(true); setHelpOpen(false); }} aria-label={copy.showMenu} title={copy.showMenu}><RagdollIcon name="stages" /></button>
          <button type="button" className="ragdoll-circle" onClick={() => setHelpOpen((value) => !value)} aria-label={copy.howToPlay} aria-expanded={helpOpen}><RagdollIcon name="help" /></button>
          <button type="button" className="ragdoll-circle" onClick={toggleMute} aria-label={soundOn ? copy.mute : copy.unmute} title={soundOn ? copy.mute : copy.unmute}><RagdollIcon name={soundOn ? "sound" : "mute"} /></button>
        </div>
      </header>

      <RagdollRecorder sceneRef={sceneRef} />

      {helpOpen && (
        <aside className="ragdoll-help">
          <div className="ragdoll-help-title"><strong>{copy.howToPlay}</strong><button type="button" onClick={() => setHelpOpen(false)} aria-label={copy.close}><RagdollIcon name="close" /></button></div>
          <p>{copy.cameraHint}</p>
          <p>{copy.grabHint}</p>
          <p>{copy.kickHint}</p>
          <p>{copy.recordHint}</p>
        </aside>
      )}

      <RagdollShow progress={challenge} completed={completedShows} mode={mode} menuOpen={showMenuOpen} cheer={cheer} onAction={challengeAction} onStage={startStage} onFree={freePlay} onMenuClose={() => setShowMenuOpen(false)} onMenuOpen={() => setShowMenuOpen(true)} />

      <div className="ragdoll-controls">
        {mode === "free" && !showMenuOpen && <button type="button" className="ragdoll-party-button" onClick={() => { unlockAudio(); sceneRef.current?.partyBlast(); }} disabled={paused} title={copy.partyHint}><RagdollIcon name="party" /> {copy.party}</button>}
        <div className="ragdoll-hint" role="status"><RagdollIcon name="help" size={17} />{hint}</div>
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
                : objects.map(({ kind, label }) => (
                    <button type="button" key={kind} className={`ragdoll-choice ragdoll-choice--object ${tool === "place-object" && selectedObject === kind ? "is-active" : ""}`} onClick={() => chooseObject(kind)} aria-pressed={tool === "place-object" && selectedObject === kind}>
                      <span className={`ragdoll-object-icon ragdoll-object-icon--${kind}`} aria-hidden="true"><RagdollIcon name={kind} size={42} /></span><span>{label}</span>
                    </button>
                  ))}
            </div>
          </section>
        )}
        <nav className="ragdoll-dock" aria-label={copy.tools}>
          <div className="ragdoll-dock-group ragdoll-dock-group--add">
            <button type="button" className={`ragdoll-dock-button ragdoll-dock-button--add ${palette === "characters" ? "is-active" : ""}`} onClick={() => setPalette((value) => value === "characters" ? null : "characters")} aria-expanded={palette === "characters"}><span className="ragdoll-tool-icon"><RagdollIcon name="characters" /></span><span>{copy.characters}</span></button>
            <button type="button" className={`ragdoll-dock-button ragdoll-dock-button--add ${palette === "objects" ? "is-active" : ""}`} onClick={() => setPalette((value) => value === "objects" ? null : "objects")} aria-expanded={palette === "objects"}><span className="ragdoll-tool-icon"><RagdollIcon name="objects" /></span><span>{copy.objects}</span></button>
          </div>
          <span className="ragdoll-dock-divider" aria-hidden="true" />
          <div className="ragdoll-dock-group ragdoll-dock-group--tools">
            {tools.map((item) => <button type="button" key={item.key} className={`ragdoll-dock-button ${tool === item.key ? "is-active" : ""}`} onClick={() => chooseTool(item.key)} aria-pressed={tool === item.key} title={item.hint}><span className="ragdoll-tool-icon" aria-hidden="true"><RagdollIcon name={item.key} /></span><span>{item.label}</span></button>)}
          </div>
          <span className="ragdoll-dock-divider" aria-hidden="true" />
          <div className="ragdoll-dock-group ragdoll-dock-group--actions">
            <button type="button" className={`ragdoll-dock-button ${wearingGlasses ? "is-active" : ""}`} onClick={() => { sceneRef.current?.toggleGlasses(); setWearingGlasses((value) => !value); }} disabled={!selectedCharacter} aria-pressed={wearingGlasses} title={selectedCharacter ? copy.glasses : copy.glassHint}><span className="ragdoll-tool-icon" aria-hidden="true"><RagdollIcon name="glasses" /></span><span>{copy.glasses}</span></button>
            <button type="button" className={`ragdoll-dock-button ${slowMo ? "is-active" : ""}`} onClick={toggleSlowMo} aria-pressed={slowMo}><span className="ragdoll-tool-icon" aria-hidden="true"><RagdollIcon name="slow" /></span><span>{slowMo ? copy.normalSpeed : copy.slowMo}</span></button>
            <button type="button" className="ragdoll-dock-button" onClick={togglePause} aria-pressed={paused}><span className="ragdoll-tool-icon" aria-hidden="true"><RagdollIcon name={paused ? "play" : "pause"} /></span><span>{paused ? copy.play : copy.pause}</span></button>
            <button type="button" ref={resetButtonRef} className="ragdoll-dock-button ragdoll-dock-button--reset" onClick={() => setResetOpen(true)}><span className="ragdoll-tool-icon" aria-hidden="true"><RagdollIcon name="reset" /></span><span>{copy.reset}</span></button>
          </div>
        </nav>
      </div>

      {resetOpen && <div className="ragdoll-modal-backdrop" role="presentation"><div ref={resetDialogRef} className="ragdoll-modal" role="alertdialog" aria-modal="true" aria-labelledby="ragdoll-reset-title" aria-describedby="ragdoll-reset-body"><div className="ragdoll-modal-symbol" aria-hidden="true"><RagdollIcon name="reset" size={38} /></div><h2 id="ragdoll-reset-title">{copy.resetTitle}</h2><p id="ragdoll-reset-body">{copy.resetBody}</p><div className="ragdoll-modal-actions"><button type="button" className="ragdoll-modal-cancel" onClick={() => setResetOpen(false)}>{copy.cancel}</button><button type="button" className="ragdoll-modal-confirm" onClick={resetPlayground}>{copy.confirmReset}</button></div></div></div>}
    </main>
  );
}
