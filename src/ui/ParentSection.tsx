import { useState } from "react";
import { Link } from "react-router-dom";
import { useGame } from "../state/store";
import { completedInWorld, WORLDS } from "../content/worlds";
import { MINIGAMES } from "../content/minigames";
import { itemById } from "../engine/economy/catalog";

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

/** Which worlds and minigames Sam may open — e.g. clock-reading focus week. */
function AccessControls() {
  const enabledWorlds = useGame((s) => s.enabledWorlds);
  const enabledGames = useGame((s) => s.enabledGames);
  const setWorldEnabled = useGame((s) => s.setWorldEnabled);
  const setGameEnabled = useGame((s) => s.setGameEnabled);

  return (
    <section className="panel parent-block">
      <h2>🔓 What can he open?</h2>
      <p className="dim">Locked items stay visible in the base but can't be opened.</p>
      {WORLDS.map((w) => {
        const on = Boolean(enabledWorlds[w.id]);
        return (
          <div key={w.id} className="parent-row parent-world-row">
            <span className="parent-world-name">
              {w.icon} {w.name}
            </span>
            <button
              className={`btn ${on ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setWorldEnabled(w.id, !on)}
            >
              {on ? "✅ Open" : "🔒 Locked"}
            </button>
          </div>
        );
      })}
      <h2>🕹️ Minigames</h2>
      {MINIGAMES.map((g) => {
        const on = Boolean(enabledGames[g.id]);
        return (
          <div key={g.id} className="parent-row parent-world-row">
            <span className="parent-world-name">
              {g.icon} {g.name}
            </span>
            <button
              className={`btn ${on ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setGameEnabled(g.id, !on)}
            >
              {on ? "✅ Open" : "🔒 Locked"}
            </button>
          </div>
        );
      })}
    </section>
  );
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

      <AccessControls />

      <RewardHistory />

      <section className="panel parent-block">
        <h2>🔄 Update the game</h2>
        <p className="dim">
          Clears the app cache and reloads so a freshly deployed version is picked up. Progress and
          rewards are NOT touched.
        </p>
        <ForceUpdateButton />
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
