import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";

const PARENT_PASSWORD = "adel";

/**
 * Deliberately NOT persisted: the unlock lives in memory, is shared by the
 * parent pages (/parent, /parent/voices) and is dropped as soon as the app
 * leaves them (ParentAutoLock) or reloads.
 */
let unlocked = false;

/** Mount once inside the router: leaving the parent pages locks them again. */
export function ParentAutoLock() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (!pathname.startsWith("/parent")) unlocked = false;
  }, [pathname]);
  return null;
}

/** The parent password screen; shows `children` once unlocked. */
export function ParentGate({ title, back = "/hub", backLabel = "Base", children }: {
  title: ReactNode;
  back?: string;
  backLabel?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(unlocked);
  const [pass, setPass] = useState("");
  const [error, setError] = useState(false);

  function tryUnlock() {
    if (pass.toLowerCase().trim() === PARENT_PASSWORD) {
      unlocked = true;
      setOpen(true);
    } else {
      setError(true);
      setPass("");
    }
  }

  if (open) return <>{children}</>;
  return (
    <div className="screen parent-screen">
      <header className="hub-header">
        <Link to={back} className="btn btn-secondary">
          ← {backLabel}
        </Link>
        <h1>{title}</h1>
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
          data-testid="parent-pass"
        />
        {error && <p className="shop-note">Not quite — try again.</p>}
        <button className="btn btn-primary" onClick={tryUnlock} data-testid="parent-unlock">
          Unlock
        </button>
      </div>
    </div>
  );
}
