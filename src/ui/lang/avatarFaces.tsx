// The people of the chat scenes, drawn in code (see avatarParts.tsx for the
// style). Grown-ups of the family first, then everyone else. Each face is a
// function of its tone so generic faces (a boy, a friend) vary by name.
// `Body` draws the shoulders: plain, or the clothes that say who someone is.
import type { AvatarKind, AvatarTone } from "./avatarMap";
import { Brows, Cheeks, Eyes, Face, Glasses, HX, HY, Head, LINE, Moustache, Shine, Shoulders, Smile } from "./avatarParts";

const DIM = "rgba(22,18,58,0.22)";

/** Short hair cap on top of a head. */
export const SHORT = "M 28 50 Q 25 26 50 26 Q 75 26 72 50 Q 70 40 62 37 Q 52 42 42 37 Q 32 39 28 50 Z";
/** A side parting. */
const PARTED = "M 28 50 Q 25 26 48 26 Q 74 25 72 48 Q 66 36 52 35 L 46 31 Q 37 40 28 50 Z";
/** A fringe over the forehead (for long hair, bobs, bunches). */
export const FRINGE = "M 29 48 Q 28 29 50 29 Q 71 29 71 47 Q 63 43 56 34 Q 47 45 29 48 Z";

export function Hair({ d, fill }: { d: string; fill: string }) {
  return <path d={d} fill={fill} stroke={LINE} strokeWidth="3.5" strokeLinejoin="round" />;
}

/** A headscarf framing the face: the drape behind, the face opening, soft folds. */
function Hijab({ t, glasses }: { t: AvatarTone; glasses?: boolean }) {
  return (
    <>
      <path d="M 50 22 Q 80 22 81 52 Q 82 75 76 90 L 24 90 Q 18 75 19 52 Q 20 22 50 22 Z" fill={t.top} stroke={LINE} strokeWidth="4" />
      <ellipse cx={HX} cy={HY + 3} rx="17" ry="19" fill={t.skin} stroke={LINE} strokeWidth="3.5" />
      <path d="M 32 41 Q 50 30 68 41" fill="none" stroke={DIM} strokeWidth="3" strokeLinecap="round" />
      <path d="M 32 75 Q 50 86 68 75" fill="none" stroke={DIM} strokeWidth="3" strokeLinecap="round" />
      <Shine d="M 29 42 Q 32 32 41 28" />
      <Brows y={HY - 3} />
      <Eyes y={HY + 4} gap={7} r={3.3} />
      {glasses && <Glasses y={HY + 4} />}
      <Cheeks y={HY + 11} gap={11} />
      <Smile y={HY + 12} w={5} />
    </>
  );
}

export function Teta({ t }: { t: AvatarTone }) {
  return <Hijab t={t} glasses />;
}

export function Aunt({ t }: { t: AvatarTone }) {
  return <Hijab t={t} />;
}

export function Jiddo({ t }: { t: AvatarTone }) {
  return (
    <>
      <Head skin={t.skin} />
      <Hair d="M 30 54 Q 26 42 33 35 Q 35 45 34 54 Z" fill={t.hair} />
      <Hair d="M 70 54 Q 74 42 67 35 Q 65 45 66 54 Z" fill={t.hair} />
      <Shine d="M 40 35 Q 46 32 53 33" />
      <Brows color="#8d8f9c" />
      <Eyes />
      <Glasses />
      <Cheeks y={HY + 7} gap={15} />
      <Moustache color={t.hair} y={HY + 8} />
      <Smile y={HY + 14} w={5} />
    </>
  );
}

export function Granny({ t }: { t: AvatarTone }) {
  return (
    <>
      <circle cx="50" cy="24" r="9" fill={t.hair} stroke={LINE} strokeWidth="3.5" />
      <Head skin={t.skin} />
      <Hair d={SHORT} fill={t.hair} />
      <Face />
      <Glasses />
      <path d="M 36 80 Q 50 90 64 80" fill="none" stroke="#fff" strokeWidth="3.5" strokeDasharray="0.1 5.5" strokeLinecap="round" />
    </>
  );
}

export function Mama({ t }: { t: AvatarTone }) {
  return (
    <>
      <Hair d="M 26 52 Q 21 23 50 22 Q 79 23 74 52 L 78 86 Q 68 90 63 80 L 37 80 Q 32 90 22 86 Z" fill={t.hair} />
      <Head skin={t.skin} ears={false} />
      <Hair d={FRINGE} fill={t.hair} />
      <Shine d="M 33 41 Q 36 34 43 32" />
      <Face open />
    </>
  );
}

export function Woman({ t }: { t: AvatarTone }) {
  return (
    <>
      <Hair d="M 25 56 Q 21 25 50 24 Q 79 25 75 56 L 76 70 Q 70 74 66 67 L 34 67 Q 30 74 24 70 Z" fill={t.hair} />
      <Head skin={t.skin} ears={false} />
      <Hair d={FRINGE} fill={t.hair} />
      <Face />
    </>
  );
}

export function Baba({ t }: { t: AvatarTone }) {
  return (
    <>
      <Head skin={t.skin} />
      <Hair d={SHORT} fill={t.hair} />
      <Hair d="M 30 54 Q 30 77 50 78 Q 70 77 70 54 Q 67 65 58 64 Q 50 60 42 64 Q 33 65 30 54 Z" fill={t.hair} />
      <Brows />
      <Eyes />
      <Cheeks y={HY + 5} gap={15} />
      <Smile y={HY + 12} w={4.5} open />
    </>
  );
}

export function Uncle({ t }: { t: AvatarTone }) {
  return (
    <>
      <Head skin={t.skin} />
      <Hair d="M 28 50 Q 21 40 29 33 Q 30 23 40 25 Q 45 18 52 22 Q 60 18 65 25 Q 76 25 72 35 Q 79 42 72 50 Q 68 40 60 39 Q 50 42 40 39 Q 32 40 28 50 Z" fill={t.hair} />
      <Brows />
      <Eyes />
      <Cheeks y={HY + 7} gap={15} />
      <Moustache color={t.hair} y={HY + 8} />
      <Smile y={HY + 14} w={5} />
    </>
  );
}

export function Man({ t }: { t: AvatarTone }) {
  return (
    <>
      <Head skin={t.skin} />
      <Hair d={PARTED} fill={t.hair} />
      <Face open />
    </>
  );
}

export function Adult({ t }: { t: AvatarTone }) {
  return (
    <>
      <Head skin={t.skin} />
      <Hair d={PARTED} fill={t.hair} />
      <Face />
      <Glasses />
    </>
  );
}

export function Teacher({ t }: { t: AvatarTone }) {
  return (
    <>
      <circle cx="68" cy="27" r="8" fill={t.hair} stroke={LINE} strokeWidth="3.5" />
      <Head skin={t.skin} />
      <Hair d={SHORT} fill={t.hair} />
      <g transform="rotate(-35 76 46)">
        <rect x="70" y="42" width="15" height="6" rx="1.5" fill="#ffd166" stroke={LINE} strokeWidth="2.4" />
        <path d="M 70 42 L 65 45 L 70 48 Z" fill="#f6dfb2" stroke={LINE} strokeWidth="2" strokeLinejoin="round" />
      </g>
      <Face open />
      <Glasses />
    </>
  );
}

/** Clothes that are part of who someone is (the hijab drape, a baker's tunic…). */
export function Body({ kind, t }: { kind: AvatarKind; t: AvatarTone }) {
  if (kind === "teta" || kind === "aunt") return <Shoulders fill={t.top} />;
  if (kind === "teacher") return <Shoulders fill={t.top} collar="#fff" />;
  if (kind === "baker") {
    return (
      <>
        <Shoulders fill={t.top} />
        <circle cx="50" cy="88" r="2.4" fill={LINE} />
        <circle cx="50" cy="97" r="2.4" fill={LINE} />
      </>
    );
  }
  if (kind === "shopkeeper") {
    return (
      <>
        <Shoulders fill="#f6f1e4" />
        <path d="M 30 84 L 70 84 L 72 104 L 28 104 Z" fill={t.top} stroke={LINE} strokeWidth="3.5" strokeLinejoin="round" />
        <path d="M 36 84 L 36 80 M 64 84 L 64 80" stroke={LINE} strokeWidth="3" strokeLinecap="round" />
      </>
    );
  }
  return <Shoulders fill={t.top} />;
}
