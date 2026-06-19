import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useGame } from "../state/store";
import { completedInWorld, WORLDS } from "../content/worlds";
import { youTubeId } from "../engine/video";
import { clearAxisMaps, requestTiltPermission } from "../engine/sensors";
import { TiltCalibrator } from "./TiltCalibrator";
import { GiftControls, RewardHistory } from "./ParentRewards";
import { PetControls } from "./ParentPet";
import { persona } from "../persona.config";
import { testCheer, timedRemindersSupported } from "../engine/notify/reminders";

const PARENT_PASSWORD = "adel";

/**
 * Parent Section: password-protected controls for Adel.
 * NOTE (CLAUDE.md rule): every new world or feature must be reflected here —
 * the world list below iterates the WORLDS registry, so new worlds appear
 * automatically; new mechanics with their own state need explicit controls.
 */
export function ParentSection() {
  // Deliberately NOT persisted: leaving the section locks it again.
  const [unlocked, setUnlocked] = useState(false);
  const [pass, setPass] = useState("");
  const [error, setError] = useState(false);

  function tryUnlock() {
    if (pass.toLowerCase().trim() === PARENT_PASSWORD) {
      setUnlocked(true);
    } else {
      setError(true);
      setPass("");
    }
  }

  if (!unlocked) {
    return (
      <div className="screen parent-screen">
        <header className="hub-header">
          <Link to="/hub" className="btn btn-secondary">
            ← Base
          </Link>
          <h1>👨‍👦 Parent Section</h1>
          <span />
        </header>
        <div className="panel parent-gate">
          <p>Enter the parent password:</p>
          <input
            className="parent-input"
            type="password"
            value={pass}
            autoFocus
            onChange={(e) => setPass(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && tryUnlock()}
          />
          {error && <p className="shop-note">Not quite — try again.</p>}
          <button className="btn btn-primary" onClick={tryUnlock}>
            Unlock
          </button>
        </div>
      </div>
    );
  }

  return <ParentControls />;
}

/**
 * Global tilt calibration. By default the games use the standard mapping
 * (works on Android). If a device feels wrong (some iPads), calibrate ONCE
 * here — the measured mapping then applies to all tilt games — or reset
 * back to the standard.
 */
function TiltControls() {
  const [calibrating, setCalibrating] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  return (
    <section className="panel parent-block">
      <h2>🧭 Tilt calibration</h2>
      <p className="dim">
        Games use the standard tilt out of the box. If tilting feels wrong on this device,
        calibrate once here; it applies to all tilt games.
      </p>
      <div className="parent-row">
        <button
          className="btn btn-primary"
          onClick={() => {
            void requestTiltPermission().then(() => {
              setNote(null);
              setCalibrating(true);
            });
          }}
        >
          Calibrate this device
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => {
            clearAxisMaps();
            setNote("✓ Back to the standard tilt");
          }}
        >
          Reset to default
        </button>
      </div>
      {note && <p className="history-redeemed">{note}</p>}
      {calibrating && (
        <TiltCalibrator
          needY
          onDone={() => {
            setCalibrating(false);
            setNote("✓ Calibrated for this device");
          }}
        />
      )}
    </section>
  );
}

/** A panel whose body can be folded away — keeps the long Parent Section tidy. */
function Collapsible({ title, subtitle, children, defaultOpen = false }: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="panel parent-block">
      <button className="parent-collapse" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <h2>{title}</h2>
        <span className="parent-collapse-icon">{open ? "▾" : "▸"}</span>
      </button>
      {open && (
        <div className="parent-collapse-body">
          {subtitle && <p className="dim">{subtitle}</p>}
          {children}
        </div>
      )}
    </section>
  );
}

/** YouTube companion: curated videos that play during the game to draw him in. */
function VideoControls() {
  const enabled = useGame((s) => s.videoEnabled);
  const urls = useGame((s) => s.videoUrls);
  const opacity = useGame((s) => s.videoOpacity);
  const setEnabled = useGame((s) => s.setVideoEnabled);
  const setOpacity = useGame((s) => s.setVideoOpacity);
  const addUrl = useGame((s) => s.addVideoUrl);
  const removeUrl = useGame((s) => s.removeVideoUrl);
  const [input, setInput] = useState("");
  const pid = youTubeId(input);
  const typed = input.trim().length > 0;
  const thumb = (vid: string) => `https://img.youtube.com/vi/${vid}/mqdefault.jpg`;

  function add() {
    if (!pid) return;
    addUrl(input);
    setInput("");
  }

  let preview: ReactNode = null;
  if (pid) {
    preview = (
      <div className="video-preview">
        <img className="video-thumb" src={thumb(pid)} alt="video preview" />
        <button className="btn btn-primary" onClick={add}>➕ Add this video</button>
      </div>
    );
  } else if (typed) {
    preview = <p className="shop-note">Hmm, that doesn't look like a YouTube link yet.</p>;
  }

  return (
    <Collapsible
      title="📺 Video companion"
      subtitle="Plays his favorite YouTube videos in a small movable corner player during the game, to gently pull his attention into playing. He can drag it but can't open YouTube."
    >
      <div className="parent-row">
        <button className={`btn ${enabled ? "btn-primary" : "btn-secondary"}`} onClick={() => setEnabled(!enabled)}>
          {enabled ? "✅ Companion on" : "⬜ Companion off"}
        </button>
        <span className="parent-world-name">Visibility {opacity}%</span>
        <input type="range" min={20} max={100} step={5} value={opacity} onChange={(e) => setOpacity(Number(e.target.value))} />
      </div>

      <div className="video-add">
        <label className="dim">Add a video — paste a YouTube link, then tap Add:</label>
        <input
          className="parent-input video-input"
          placeholder="youtube.com/watch?v=…   or   youtu.be/…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          autoComplete="off"
        />
        {preview}
      </div>

      {urls.length === 0 ? (
        <p className="dim">No videos added yet.</p>
      ) : (
        <div className="video-grid">
          {urls.map((u) => {
            const vid = youTubeId(u);
            return (
              <div key={u} className="video-card">
                {vid && <img className="video-thumb" src={thumb(vid)} alt="saved video" />}
                <button className="btn btn-danger video-remove" aria-label="remove video" onClick={() => removeUrl(u)}>
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}
    </Collapsible>
  );
}

/** Manage worlds: hide them from the hub, and lock/unlock what Sam can open. */
function AccessControls() {
  const enabledWorlds = useGame((s) => s.enabledWorlds);
  const hiddenWorlds = useGame((s) => s.hiddenWorlds);
  const setWorldEnabled = useGame((s) => s.setWorldEnabled);
  const setWorldHidden = useGame((s) => s.setWorldHidden);
  const showAllWorlds = useGame((s) => s.showAllWorlds);
  const hiddenCount = WORLDS.filter((w) => hiddenWorlds[w.id]).length;

  return (
    <Collapsible
      title={`🌍 Worlds (${WORLDS.length})`}
      subtitle="Hide worlds to declutter Sam's base (all are shown by default). A locked world stays visible but can't be opened."
    >
      {hiddenCount > 0 && (
        <div className="parent-row">
          <span className="parent-world-name">
            {hiddenCount} world{hiddenCount === 1 ? "" : "s"} hidden
          </span>
          <button className="btn btn-secondary" onClick={showAllWorlds}>
            Show all
          </button>
        </div>
      )}
      {WORLDS.map((w) => {
        const on = Boolean(enabledWorlds[w.id]);
        const hidden = Boolean(hiddenWorlds[w.id]);
        return (
          <div key={w.id} className="parent-row parent-world-row" style={hidden ? { opacity: 0.55 } : undefined}>
            <span className="parent-world-name">
              {w.icon} {w.name}
            </span>
            <button
              className={`btn ${hidden ? "btn-secondary" : "btn-primary"}`}
              onClick={() => setWorldHidden(w.id, !hidden)}
            >
              {hidden ? "🙈 Hidden" : "👁️ Shown"}
            </button>
            {!hidden && (
              <button
                className={`btn ${on ? "btn-primary" : "btn-secondary"}`}
                onClick={() => setWorldEnabled(w.id, !on)}
              >
                {on ? "✅ Open" : "🔒 Locked"}
              </button>
            )}
          </div>
        );
      })}
    </Collapsible>
  );
}

/** Encouragement reminders: timed local notifications to draw Sam back. */
function ReminderControls() {
  const on = useGame((s) => s.remindersOn);
  const setReminders = useGame((s) => s.setReminders);
  const [note, setNote] = useState<string | null>(null);
  const supported = timedRemindersSupported();

  return (
    <section className="panel parent-block">
      <h2>🔔 Encouragement reminders</h2>
      <p className="dim">
        Friendly notifications about every 6 hours (daytime only) inviting {persona.name} back —
        like “Cosmo misses you!”. They fire even when the app is closed.
      </p>
      <div className="parent-row">
        <button
          className={`btn ${on ? "btn-primary" : "btn-secondary"}`}
          onClick={() => {
            void setReminders(!on).then((armed) => {
              setNote(!on && !armed ? "Couldn't turn on — please allow notifications for this app, then try again." : null);
            });
          }}
        >
          {on ? "✅ On" : "⬜ Off"}
        </button>
        {on && (
          <button className="btn btn-secondary" onClick={() => void testCheer()}>
            Send a test now
          </button>
        )}
      </div>
      {!supported && (
        <p className="dim">
          Heads up: timed reminders need Android/Chrome. This device may not support scheduling them
          while closed (iPads can't yet).
        </p>
      )}
      {note && <p className="history-redeemed">{note}</p>}
    </section>
  );
}

async function forceUpdate(): Promise<void> {
  try {
    const regs = (await navigator.serviceWorker?.getRegistrations()) ?? [];
    await Promise.all(regs.map((r) => r.unregister()));
    if (typeof caches !== "undefined") {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } finally {
    window.location.reload();
  }
}

function ForceUpdateButton() {
  const [busy, setBusy] = useState(false);
  return (
    <button
      className="btn btn-primary"
      disabled={busy}
      onClick={() => {
        setBusy(true);
        void forceUpdate();
      }}
    >
      {busy ? "Updating…" : "Clear cache & reload"}
    </button>
  );
}

function ParentControls() {
  const starDust = useGame((s) => s.starDust);
  const progress = useGame((s) => s.progress);
  const setStarDust = useGame((s) => s.setStarDust);
  const setWorldProgress = useGame((s) => s.setWorldProgress);
  const resetAll = useGame((s) => s.resetAll);
  const [dustInput, setDustInput] = useState(String(starDust));
  const [confirmReset, setConfirmReset] = useState(false);
  const [worldInputs, setWorldInputs] = useState<Record<string, string>>({});

  return (
    <div className="screen parent-screen">
      <header className="hub-header">
        <Link to="/hub" className="btn btn-secondary">
          ← Base
        </Link>
        <h1>👨‍👦 Parent Section</h1>
        <span className="dust-counter">✨ {starDust}</span>
      </header>

      <section className="panel parent-block">
        <h2>🔄 Update the game</h2>
        <p className="dim">
          Clears the app cache and reloads so a freshly deployed version is picked up. Progress and
          rewards are NOT touched.
        </p>
        <ForceUpdateButton />
      </section>

      <section className="panel parent-block">
        <h2>✨ Star Dust</h2>
        <div className="parent-row">
          <input
            className="parent-input"
            type="number"
            min={0}
            value={dustInput}
            onChange={(e) => setDustInput(e.target.value)}
          />
          <button
            className="btn btn-primary"
            onClick={() => setStarDust(Number(dustInput) || 0)}
          >
            Set
          </button>
        </div>
      </section>

      <Collapsible
        title={`📈 World progress (${WORLDS.length})`}
        subtitle="Set how many levels count as completed — e.g. roll him back from 20 to 10."
      >
        {WORLDS.map((w) => {
          const done = completedInWorld(w, progress);
          const value = worldInputs[w.id] ?? String(done);
          return (
            <div key={w.id} className="parent-row parent-world-row">
              <span className="parent-world-name">
                {w.icon} {w.name}
              </span>
              <span className="dim">{done}/{w.stages.length}</span>
              <input
                className="parent-input parent-input-sm"
                type="number"
                min={0}
                max={w.stages.length}
                value={value}
                onChange={(e) => setWorldInputs((m) => ({ ...m, [w.id]: e.target.value }))}
              />
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setWorldProgress(w.id, Number(value) || 0);
                  setWorldInputs((m) => ({ ...m, [w.id]: String(Math.min(w.stages.length, Number(value) || 0)) }));
                }}
              >
                Set
              </button>
            </div>
          );
        })}
      </Collapsible>

      <AccessControls />

      <PetControls />

      <GiftControls />

      <ReminderControls />

      <VideoControls />

      <TiltControls />

      <RewardHistory />

      <section className="panel parent-block parent-danger">
        <h2>🧨 Full reset</h2>
        <p className="dim">Wipes everything: progress, Star Dust, badges, coupons. Cannot be undone.</p>
        {confirmReset ? (
          <div className="parent-row">
            <button className="btn btn-secondary" onClick={() => setConfirmReset(false)}>
              Cancel
            </button>
            <button className="btn btn-danger" onClick={() => void resetAll()}>
              Yes, erase everything
            </button>
          </div>
        ) : (
          <button className="btn btn-danger" onClick={() => setConfirmReset(true)}>
            Reset everything…
          </button>
        )}
      </section>
    </div>
  );
}
