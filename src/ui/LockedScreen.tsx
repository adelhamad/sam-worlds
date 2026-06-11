import { Link } from "react-router-dom";

/** Shown when Sam reaches a world/minigame the parent has switched off. */
export function LockedScreen() {
  return (
    <div className="screen locked-screen">
      <div className="panel celebration-card">
        <div className="big-symbol">🔒</div>
        <h2>This one is resting!</h2>
        <p className="catch-howto dim">Ask Daddy to open it in the Parent Section.</p>
        <Link to="/hub" className="btn btn-primary btn-big">
          ← Back to Base
        </Link>
      </div>
    </div>
  );
}
