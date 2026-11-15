// Drawn icons: one small family of original inline-SVG pictures in the same
// chunky toy style as Pogo and the chess pieces (art in art-*.ts). They replace
// emoji everywhere in the course experience. Decorative: callers label buttons.
import type { CSSProperties } from "react";
import { iconNameOf, type IconName } from "../../content/iconNames";
import { ChessPiece } from "../chess/ChessPiece";
import { INK, SHINE, type MonoMode, type Part } from "./geom";
import { pieceOfGlyph } from "./glyphText";
import { iconArt } from "./registry";
import "./icons.css";

export interface IconProps {
  name: IconName;
  /** Rendered size in px, or a CSS length such as "1.2em" to follow the text. */
  size?: number | string;
  className?: string;
  /** Single-colour outline version that follows `currentColor` (chrome buttons). */
  mono?: boolean;
}

const ROUND = { strokeLinecap: "round", strokeLinejoin: "round" } as const;

function monoWidth(m: MonoMode | undefined, fallback: number): number {
  return typeof m === "number" ? m : fallback;
}

function colourPart(part: Part, key: number) {
  if ("b" in part) return <path key={key} d={part.b} fill={part.f} stroke={INK} strokeWidth={part.w ?? 2.2} {...ROUND} />;
  if ("a" in part) return <path key={key} d={part.a} fill={part.f} opacity={part.o} />;
  if ("i" in part) return <path key={key} d={part.i} fill="none" stroke={part.f ?? INK} strokeWidth={part.w ?? 1.8} {...ROUND} />;
  if ("d" in part) return <path key={key} d={part.d} fill={part.f ?? INK} />;
  return <path key={key} d={part.s} fill="none" stroke={SHINE} strokeWidth={part.w ?? 1.8} {...ROUND} />;
}

function monoPart(part: Part, key: number) {
  if ("s" in part || part.m === false) return null;
  if ("b" in part) {
    const solid = part.m === "solid";
    return (
      <path key={key} d={part.b} fill="currentColor" fillOpacity={solid ? 1 : 0.18} stroke="currentColor"
        strokeWidth={monoWidth(part.m, part.w ?? 2.2)} {...ROUND} />
    );
  }
  if ("a" in part) return part.m === "solid" ? <path key={key} d={part.a} fill="currentColor" /> : null;
  if ("i" in part) return <path key={key} d={part.i} fill="none" stroke="currentColor" strokeWidth={monoWidth(part.m, part.w ?? 1.8)} {...ROUND} />;
  if (part.f && part.m !== "solid") return null;
  return <path key={key} d={part.d} fill="currentColor" />;
}

export function Icon({ name, size = 24, className = "", mono = false }: IconProps) {
  const art = iconArt(name);
  const style: CSSProperties = { width: size, height: size };
  return (
    <svg
      className={`ticon ticon-${name} ${mono ? "is-mono" : ""} ${className}`}
      viewBox="0 0 32 32" style={style} aria-hidden="true" focusable="false"
    >
      {art ? art.map((part, i) => (mono ? monoPart(part, i) : colourPart(part, i))) : <rect x="3" y="3" width="26" height="26" rx="6" className="ticon-missing" />}
    </svg>
  );
}

export interface GlyphProps {
  /** `icon:<name>` draws that icon; anything else is shown as text (legacy emoji / letters). */
  value: string;
  /** Rendered size in px, or a CSS length such as "1.2em". */
  size?: number | string;
  className?: string;
  mono?: boolean;
}

/** Draws a unit / souvenir / world / trophy picture, whatever form its data uses. */
export function Glyph({ value, size = 24, className = "", mono = false }: GlyphProps) {
  const name = iconNameOf(value);
  if (name) return <Icon name={name} size={size} className={className} mono={mono} />;
  // Chess units keep text-style chess glyphs in their data and old trophies:
  // draw the real piece instead.
  const piece = pieceOfGlyph(value);
  if (piece && typeof size === "number") return <ChessPiece type={piece} size={size} className={`ticon-piece ${className}`} />;
  if (piece) {
    return (
      <span className={`ticon-piece-box ${className}`} style={{ width: size, height: size }} aria-hidden="true">
        <ChessPiece type={piece} fit />
      </span>
    );
  }
  const fontSize = typeof size === "number" ? size * 0.85 : `calc(${size} * 0.85)`;
  return <span className={`ticon-text ${className}`} style={{ fontSize, lineHeight: 1 }} aria-hidden="true">{value}</span>;
}
