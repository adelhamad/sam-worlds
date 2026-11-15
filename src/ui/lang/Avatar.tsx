// A person in a chat scene, as a small round drawn face:
//   <Avatar who="Teta" size={44} />
// `who` is a scene's `who.name` in either course ("Jiddo", "‘Ammo", "Mamie",
// "la maîtresse", "Léa's dad"…) or the player's own name. avatarMap.ts decides
// which face it is; the drawings live in avatarFaces.tsx and avatarKids.tsx.
// Pure SVG: no CSS needed, no emoji, no text.
import { useId, type ComponentType } from "react";
import { persona } from "../../persona.config";
import { Adult, Aunt, Baba, Body, Granny, Jiddo, Man, Mama, Teacher, Teta, Uncle, Woman } from "./avatarFaces";
import { Baby, Baker, Boy, Girl, Kid, Sam, Shopkeeper } from "./avatarKids";
import { avatarKind, avatarTone, type AvatarKind, type AvatarTone } from "./avatarMap";
import { Badge } from "./avatarParts";

const FACES: Record<AvatarKind, ComponentType<{ t: AvatarTone }>> = {
  teta: Teta, jiddo: Jiddo, granny: Granny, mama: Mama, baba: Baba, aunt: Aunt, uncle: Uncle,
  woman: Woman, man: Man, adult: Adult, teacher: Teacher, shopkeeper: Shopkeeper, baker: Baker,
  boy: Boy, girl: Girl, kid: Kid, baby: Baby, sam: Sam,
};

interface AvatarProps {
  /** A scene's `who.name`, or the player's name. */
  who: string | undefined;
  size?: number;
  className?: string;
}

export function Avatar({ who, size = 44, className = "" }: AvatarProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const name = who ?? "";
  const kind = name === persona.name ? "sam" : avatarKind(name);
  const tone = avatarTone(kind, name);
  const Face = FACES[kind];
  return (
    <svg
      viewBox="0 0 100 100" width={size} height={size} className={`lx-avatar ${className}`}
      data-avatar={kind} aria-hidden="true" focusable="false"
    >
      <Badge id={`av${uid}`} tone={tone} body={<Body kind={kind} t={tone} />}>
        <Face t={tone} />
      </Badge>
    </svg>
  );
}
