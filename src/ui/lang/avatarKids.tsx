// Chat avatars, part two: the children (Sam, cousins, friends, a baby) and the
// people of the shops (shopkeeper, baker). Same style as avatarFaces.tsx.
import type { AvatarTone } from "./avatarMap";
import { FRINGE, Hair, SHORT } from "./avatarFaces";
import { Cheeks, Eyes, Face, HX, HY, Head, LINE, Moustache, Shine, Smile } from "./avatarParts";

/** Sam himself: tousled hair with a cowlick, his violet hoodie (Pogo's colour). */
export function Sam({ t }: { t: AvatarTone }) {
  return (
    <>
      <path d="M 34 78 Q 50 70 66 78 L 66 84 Q 50 78 34 84 Z" fill="#6a4ee6" stroke={LINE} strokeWidth="3" strokeLinejoin="round" />
      <path d="M 44 82 L 43 94 M 56 82 L 57 94" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
      <Head skin={t.skin} />
      <Hair d="M 27 50 Q 24 24 50 24 Q 76 24 73 50 Q 70 38 64 35 L 60 41 L 55 34 L 49 41 L 44 34 L 38 40 Q 31 39 27 50 Z" fill={t.hair} />
      <path d="M 49 25 Q 50 12 63 13 Q 56 17 57 26" fill={t.hair} stroke={LINE} strokeWidth="3.2" strokeLinejoin="round" />
      <Shine d="M 34 37 Q 38 31 45 29" />
      <Face open />
    </>
  );
}

/** A boy (cousin, friend, brother). */
export function Boy({ t }: { t: AvatarTone }) {
  return (
    <>
      <Head skin={t.skin} />
      <Hair d={SHORT} fill={t.hair} />
      <path d="M 40 30 Q 44 22 52 24" fill="none" stroke={LINE} strokeWidth="3" strokeLinecap="round" />
      <Face open />
    </>
  );
}

/** A girl (cousin, friend, sister): two bunches with hair ties. */
export function Girl({ t }: { t: AvatarTone }) {
  return (
    <>
      <circle cx="24" cy="40" r="10" fill={t.hair} stroke={LINE} strokeWidth="3.5" />
      <circle cx="76" cy="40" r="10" fill={t.hair} stroke={LINE} strokeWidth="3.5" />
      <Head skin={t.skin} ears={false} />
      <Hair d={FRINGE} fill={t.hair} />
      <circle cx="31" cy="37" r="4" fill={t.top} stroke={LINE} strokeWidth="2.6" />
      <circle cx="69" cy="37" r="4" fill={t.top} stroke={LINE} strokeWidth="2.6" />
      <Face open />
    </>
  );
}

/** A child we know nothing about: a woolly hat with a pompom. */
export function Kid({ t }: { t: AvatarTone }) {
  return (
    <>
      <Head skin={t.skin} />
      <circle cx="50" cy="19" r="7" fill="#fff" stroke={LINE} strokeWidth="3.2" />
      <path d="M 28 44 Q 27 22 50 22 Q 73 22 72 44 Z" fill={t.top} stroke={LINE} strokeWidth="3.5" strokeLinejoin="round" />
      <rect x="25" y="39" width="50" height="10" rx="5" fill={t.top} stroke={LINE} strokeWidth="3.5" />
      <path d="M 31 44 H 69" stroke="rgba(255,255,255,0.45)" strokeWidth="2.4" strokeDasharray="3 3" />
      <Shine d="M 35 34 Q 38 27 45 25" />
      <Face open brows={false} />
    </>
  );
}

/** A baby: a big round head, one curl, a bib. */
export function Baby({ t }: { t: AvatarTone }) {
  return (
    <>
      <path d="M 36 77 Q 50 92 64 77 Z" fill="#fff" stroke={LINE} strokeWidth="3" strokeLinejoin="round" />
      <Head skin={t.skin} rx={24} ry={23} />
      <path d="M 47 30 Q 42 21 51 19 Q 59 20 55 27" fill="none" stroke={LINE} strokeWidth="3.4" strokeLinecap="round" />
      <Eyes y={HY + 2} gap={9.5} r={4.2} />
      <Cheeks y={HY + 9} gap={16} />
      <ellipse cx={HX} cy={HY + 12} rx="3.2" ry="2.6" fill="#8a2f45" stroke={LINE} strokeWidth="2.2" />
    </>
  );
}

/** At the shop: a flat cap and a moustache (the apron is the body). */
export function Shopkeeper({ t }: { t: AvatarTone }) {
  return (
    <>
      <Head skin={t.skin} />
      <path d="M 28 43 Q 28 25 50 25 Q 72 25 72 43 Z" fill={t.top} stroke={LINE} strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M 27 43 Q 52 36 80 45 Q 77 50 52 47 Q 36 47 27 47 Z" fill={t.top} stroke={LINE} strokeWidth="3.2" strokeLinejoin="round" />
      <Shine d="M 36 34 Q 41 29 48 28" />
      <Eyes />
      <Cheeks y={HY + 7} gap={15} />
      <Moustache color={t.hair} y={HY + 8} />
      <Smile y={HY + 14} w={5} />
    </>
  );
}

/** At the bakery: a tall puffy white hat. */
export function Baker({ t }: { t: AvatarTone }) {
  return (
    <>
      <Head skin={t.skin} />
      <g fill="#fffaf0" stroke={LINE} strokeWidth="3.2">
        <circle cx="37" cy="22" r="9" />
        <circle cx="63" cy="22" r="9" />
        <circle cx="50" cy="15" r="11" />
        <rect x="31" y="24" width="38" height="13" rx="4" />
      </g>
      <path d="M 44 26 V 35 M 56 26 V 35" stroke="rgba(22,18,58,0.2)" strokeWidth="2.4" strokeLinecap="round" />
      <Eyes />
      <Cheeks y={HY + 7} gap={15} />
      <Moustache color={t.hair} y={HY + 8} />
      <Smile y={HY + 14} w={5} />
    </>
  );
}
