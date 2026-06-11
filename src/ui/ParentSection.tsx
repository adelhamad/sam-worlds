import { useState } from "react";
import { Link } from "react-router-dom";
import { useGame } from "../state/store";
import { completedInWorld, WORLDS } from "../content/worlds";
import { clearAxisMaps } from "../engine/sensors";
import { itemById } from "../engine/economy/catalog";

const PARENT_PASSWORD = "adel";
const UNLOCK_KEY = "parent-unlocked";

/**
 * Parent Section: password-protected controls for Adel.
 * NOTE (CLAUDE.md rule): every new world or feature must be reflected here —
 * the world list below iterates the WORLDS registry, so new worlds appear
 * automatically; new mechanics with their own state need explicit controls.
 */
export function ParentSection() {
  const [unlocked, setUnlocked] = useState(sessionStorage.getItem(UNLOCK_KEY) === "1");
  const [pass, setPass] = useState("");
  const [error, setError] = useState(false);

  function tryUnlock() {
    if (pass.toLowerCase().trim() === PARENT_PASSWORD) {
      sessionStorage.setItem(UNLOCK_KEY, "1");
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

function fmt(t: number): string {
  return new Date(t).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Every Daddy Reward ever bought: what, when bought, when redeemed. */
function RewardHistory() {
  const coupons = useGame((s) => s.coupons);
  const rows = [...coupons].sort(
    (a, b) => (b.redeemedAt ?? b.purchasedAt) - (a.redeemedAt ?? a.purchasedAt),
  );
  const redeemedCount = rows.filter((c) => c.redeemedAt).length;

  return (
    <section className="panel parent-block">
      <h2>🎟️ Daddy Rewards history</h2>
      <p className="dim">
        {rows.length === 0
          ? "No rewards bought yet."
          : `${rows.length} bought · ${redeemedCount} redeemed · ${rows.length - redeemedCount} still in the wallet.`}
      </p>
      {rows.map((c) => {
        const item = itemById(c.itemId);
        return (
          <div key={c.id} className="parent-row parent-history-row">
            <span className="parent-world-name">
              {item?.icon ?? "🎟️"} {item?.name ?? c.itemId}
            </span>
            {c.redeemedAt ? (
              <span className="history-redeemed">✓ Redeemed {fmt(c.redeemedAt)}</span>
            ) : (
              <span className="dim">In wallet — bought {fmt(c.purchasedAt)}</span>
            )}
          </div>
        );
      })}
    </section>
  );
}

function TiltResetButton() {
  const [done, setDone] = useState(false);
  return (
    <button
      className="btn btn-secondary"
      onClick={() => {
        clearAxisMaps();
        setDone(true);
      }}
    >
      {done ? "✓ Will re-calibrate on next play" : "Reset tilt calibration"}
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

      <section className="panel parent-block">
        <h2>🌍 World progress</h2>
        <p className="dim">Set how many levels count as completed — e.g. roll him back from 20 to 10.</p>
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
      </section>

      <RewardHistory />

      <section className="panel parent-block">
        <h2>🧭 Tilt games</h2>
        <p className="dim">If tilting feels wrong on this device, redo the quick setup.</p>
        <TiltResetButton />
      </section>

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
