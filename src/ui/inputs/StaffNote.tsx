import { WHITE_KEYS } from "../../engine/music/notes";

// Treble staff: 5 lines. White keys C4..C5 map to vertical positions, where
// E4 is the bottom line. Each step (line→space→line) is half a line gap.
// staffStep: 0 = E4 (bottom line), counting up by diatonic step.
const STAFF_STEP: Record<string, number> = {
  C4: -2, D4: -1, E4: 0, F4: 1, G4: 2, A4: 3, B4: 4, C5: 5,
};

const TOP = 20; // y of top line
const GAP = 12; // px between lines

/** Render one written note on a treble staff (for note-reading). */
export function StaffNote({ note }: { note: string }) {
  if (!WHITE_KEYS.includes(note)) return null;
  const step = STAFF_STEP[note] ?? 0;
  // bottom line (E4, step 0) sits at TOP + 4*GAP; up a step raises by GAP/2
  const cy = TOP + 4 * GAP - (step * GAP) / 2;
  const cx = 96;
  const needsLedger = note === "C4"; // below the bottom line

  return (
    <svg viewBox="0 0 140 96" className="staff" role="img" aria-label="note on staff">
      {[0, 1, 2, 3, 4].map((i) => (
        <line key={i} x1="12" y1={TOP + i * GAP} x2="128" y2={TOP + i * GAP} stroke="#9fb0d8" strokeWidth="1.5" />
      ))}
      {/* simple treble-clef mark */}
      <text x="20" y={TOP + 4 * GAP} fontSize="46" fill="#ffb454" style={{ fontWeight: 700 }}>
        𝄞
      </text>
      {needsLedger && <line x1={cx - 12} y1={cy} x2={cx + 12} y2={cy} stroke="#9fb0d8" strokeWidth="1.5" />}
      <ellipse cx={cx} cy={cy} rx="8" ry="6" fill="#22d3ee" transform={`rotate(-18 ${cx} ${cy})`} />
      <line x1={cx + 7.5} y1={cy - 2} x2={cx + 7.5} y2={cy - 30} stroke="#22d3ee" strokeWidth="2.5" />
    </svg>
  );
}
