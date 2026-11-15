// DEV-only gallery of the drawn icons (route /tour/lab/icons): every icon at
// 16 / 24 / 40 / 72 px on a dark and a light card, colour and mono, plus the
// list of names that still lack artwork (must stay empty).
// `#/tour/lab/icons?big=1` shows only the 72 px colour row (quick visual pass);
// `?only=a,b` limits the gallery to those names.
import type { CSSProperties } from "react";
import { useSearchParams } from "react-router-dom";
import { ICON_NAMES, type IconName } from "../../../content/iconNames";
import { Glyph, Icon } from "../../../ui/icons/Icon";
import { missingIconArt, strayIconArt } from "../../../ui/icons/registry";

const SIZES = [16, 24, 40, 72];
const DARK = "#1b2150";
const LIGHT = "#fff8ec";

const page: CSSProperties = { minHeight: "100vh", overflowY: "auto", padding: 16, background: "#0d1238", color: "#fff", fontFamily: "inherit" };
const grid: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 };
const row = (bg: string, fg: string): CSSProperties => ({ display: "flex", alignItems: "flex-end", gap: 10, padding: 8, borderRadius: 12, background: bg, color: fg });

function Card({ name, big }: { name: IconName; big: boolean }) {
  if (big) {
    return (
      <div style={{ ...row(DARK, "#fff"), flexDirection: "column", alignItems: "center" }} data-icon={name}>
        <Icon name={name} size={72} />
        <code style={{ fontSize: 12 }}>{name}</code>
      </div>
    );
  }
  return (
    <div style={{ background: "#232a63", borderRadius: 14, padding: 10, display: "grid", gap: 6 }} data-icon={name}>
      <code style={{ fontSize: 13, fontWeight: 800 }}>{name}</code>
      <div style={row(DARK, "#fff")}>{SIZES.map((s) => <Icon key={s} name={name} size={s} />)}</div>
      <div style={row(LIGHT, "#16123a")}>{SIZES.map((s) => <Icon key={s} name={name} size={s} />)}</div>
      <div style={{ display: "flex", gap: 6 }}>
        <div style={{ ...row(DARK, "#e9ecff"), flex: 1 }}>{[16, 24, 40].map((s) => <Icon key={s} name={name} size={s} mono />)}</div>
        <div style={{ ...row(LIGHT, "#3a2f7a"), flex: 1 }}>{[16, 24, 40].map((s) => <Icon key={s} name={name} size={s} mono />)}</div>
      </div>
    </div>
  );
}

export default function IconLab() {
  const [params] = useSearchParams();
  const big = params.get("big") === "1";
  const only = params.get("only")?.split(",");
  const names = only ? ICON_NAMES.filter((name) => only.includes(name)) : ICON_NAMES;
  const missing = missingIconArt();
  const stray = strayIconArt();
  return (
    <div style={page} data-testid="icon-lab">
      <h1 style={{ margin: "0 0 4px", fontSize: 22 }}>Icon lab · {ICON_NAMES.length} icons</h1>
      <p style={{ margin: "0 0 4px", color: missing.length ? "#ff8a9a" : "#8ff0b0" }} data-testid="icon-missing">
        Missing art: {missing.length ? missing.join(", ") : "none"}
      </p>
      <p style={{ margin: "0 0 12px", color: stray.length ? "#ff8a9a" : "#8ff0b0" }}>Art without a name: {stray.length ? stray.join(", ") : "none"}</p>
      <div style={{ ...row(LIGHT, "#16123a"), marginBottom: 12, flexWrap: "wrap", fontSize: 18 }}>
        Glyph fallbacks: <Glyph value="icon:trophy" size={32} /> <Glyph value="♜︎" size={32} /> <Glyph value="♟︎" size={32} /> <Glyph value="AB" size={32} />
      </div>
      <div style={big ? { ...grid, gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))" } : grid}>
        {names.map((name) => <Card key={name} name={name} big={big} />)}
      </div>
    </div>
  );
}
