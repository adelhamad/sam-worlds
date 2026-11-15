// Card identity and names. A card is its label AND its picture: two
// picture-only clock cards (label "") are different cards when their times
// differ. The audits compare cards with `cardKey`; the widgets give a
// picture-only card its accessible name with `cardName`. Pure.
import { timeKey } from "../tick/clock";
import type { KitArt, KitItem } from "./types";

/** "icon:tree", "clock:3:30", or "" for a card without a picture. */
export function artKey(art: KitArt | undefined): string {
  if (!art) return "";
  return art.kind === "clock" ? `clock:${timeKey(art)}` : `icon:${art.name}`;
}

/** What makes two cards look alike: the label (case-insensitive) plus the picture. */
export function cardKey(item: KitItem): string {
  return `${item.label.trim().toLowerCase()}|${artKey(item.art)}`;
}

/** Words for a picture: the icon's name ("arrow up") or the clock's digits ("3:30"). */
export function artName(art: KitArt): string {
  return art.kind === "clock" ? timeKey(art) : art.name.replace(/-/g, " ");
}

/** The label, or — for a picture-only card — the name of its picture. */
export function cardName(item: KitItem): string {
  const label = item.label.trim();
  if (label) return label;
  return item.art ? artName(item.art) : "";
}
