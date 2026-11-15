// Pogo as a button: tap him and he reacts (see usePogoPoke). The motion lives
// on a wrapper so it never fights the mood's own animation inside the SVG.
import type { ReactNode } from "react";
import type { PogoPoke } from "./usePogoPoke";

export function PogoTap({ poke, label, className = "", children }: { poke: PogoPoke; label: string; className?: string; children: ReactNode }) {
  const motion = poke.count > 0 ? `pogo-poke-${(poke.count - 1) % 4}` : "";
  return (
    <button type="button" className={`pogo-tap ${className}`} aria-label={label} onClick={poke.poke}>
      <span key={poke.count} className={`pogo-poke ${motion}`}>{children}</span>
    </button>
  );
}
