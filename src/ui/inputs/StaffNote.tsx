// A small staff renderer: treble OR bass clef, accidentals, ledger lines, and
// one or more noteheads (chords / intervals). Positions come from the note's
// diatonic step so any note in range lands correctly.
const LETTER_IDX: Record<string, number> = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };

const TOP = 40; // y of the top staff line
const GAP = 12; // px between staff lines
const BOTTOM = TOP + 4 * GAP; // y of the bottom staff line
// Bottom-line diatonic step per clef: treble E4, bass G2.
const REF: Record<string, number> = { treble: 2 + 7 * 4, bass: 4 + 7 * 2 };

interface Parsed {
  step: number;
  accidental: string;
}
function parse(note: string): Parsed | null {
  const m = /^([A-G])([#b]?)(\d+)$/.exec(note);
  if (!m) return null;
  return { step: LETTER_IDX[m[1]] + 7 * parseInt(m[3], 10), accidental: m[2] };
}

function noteY(step: number, ref: number): number {
  return BOTTOM - (step - ref) * (GAP / 2);
}

/** Ledger-line Y positions a note above/below the staff needs. */
function ledgerYs(step: number, ref: number): number[] {
  const out: number[] = [];
  for (let s = ref + 10; s <= step; s += 2) out.push(noteY(s, ref)); // above top line
  for (let s = ref - 2; s >= step; s -= 2) out.push(noteY(s, ref)); // below bottom line
  return out;
}

function NoteGlyph({ note, clef, cx }: { note: string; clef: string; cx: number }) {
  const p = parse(note);
  if (!p) return null;
  const ref = REF[clef] ?? REF.treble;
  const cy = noteY(p.step, ref);
  return (
    <g>
      {ledgerYs(p.step, ref).map((y) => (
        <line key={y} x1={cx - 12} y1={y} x2={cx + 12} y2={y} stroke="#9fb0d8" strokeWidth="1.5" />
      ))}
      {p.accidental && (
        <text x={cx - 22} y={cy + 6} fontSize="20" fill="#22d3ee" fontWeight={700}>
          {p.accidental === "#" ? "♯" : "♭"}
        </text>
      )}
      <ellipse cx={cx} cy={cy} rx="8" ry="6" fill="#22d3ee" transform={`rotate(-18 ${cx} ${cy})`} />
      <line x1={cx + 7.5} y1={cy - 2} x2={cx + 7.5} y2={cy - 30} stroke="#22d3ee" strokeWidth="2.5" />
    </g>
  );
}

/** Render one or more notes on a treble/bass staff. */
export function StaffNote({ note, clef = "treble" }: { note: string | string[]; clef?: string }) {
  const notes = Array.isArray(note) ? note : [note];
  const xs = notes.length > 1 ? [92, 124] : [108];
  const clefMark = clef === "bass" ? "𝄢" : "𝄞";
  return (
    <svg viewBox="0 0 170 130" className="staff" role="img" aria-label="note on staff">
      {[0, 1, 2, 3, 4].map((i) => (
        <line key={i} x1="12" y1={TOP + i * GAP} x2="158" y2={TOP + i * GAP} stroke="#9fb0d8" strokeWidth="1.5" />
      ))}
      <text x="18" y={clef === "bass" ? TOP + 2.4 * GAP : TOP + 4 * GAP} fontSize="46" fill="#ffb454" fontWeight={700}>
        {clefMark}
      </text>
      {notes.map((n, i) => (
        <NoteGlyph key={`${n}-${i}`} note={n} clef={clef} cx={xs[Math.min(i, xs.length - 1)]} />
      ))}
    </svg>
  );
}
