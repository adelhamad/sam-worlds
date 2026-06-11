import { useState } from "react";
import { Link } from "react-router-dom";
import { sfx, unlockAudio } from "../../engine/feedback/audio";

type Op = "+" | "−" | "×" | "÷";

const MAX_DIGITS = 12;

function compute(a: number, b: number, op: Op): number {
  switch (op) {
    case "+":
      return a + b;
    case "−":
      return a - b;
    case "×":
      return a * b;
    case "÷":
      return a / b;
  }
}

/** Trim float noise and keep the display within bounds. */
function format(n: number): string {
  if (!Number.isFinite(n)) return "Oops!";
  const clean = parseFloat(n.toPrecision(12));
  const s = String(clean);
  return s.length > MAX_DIGITS + 2 ? clean.toExponential(6) : s;
}

export function Calculator() {
  const [display, setDisplay] = useState("0");
  const [acc, setAcc] = useState<number | null>(null);
  const [op, setOp] = useState<Op | null>(null);
  const [waiting, setWaiting] = useState(false); // next digit starts a new number

  function tap(fn: () => void) {
    unlockAudio();
    sfx.tap();
    fn();
  }

  function inputDigit(d: string) {
    if (waiting || display === "Oops!") {
      setDisplay(d === "." ? "0." : d);
      setWaiting(false);
      return;
    }
    if (d === "." && display.includes(".")) return;
    if (display.replace(/[-.]/g, "").length >= MAX_DIGITS) return;
    setDisplay(display === "0" && d !== "." ? d : display + d);
  }

  function pressOp(next: Op) {
    const current = parseFloat(display);
    if (op !== null && acc !== null && !waiting) {
      const result = compute(acc, current, op);
      setAcc(Number.isFinite(result) ? result : null);
      setDisplay(format(result));
    } else {
      setAcc(current);
    }
    setOp(next);
    setWaiting(true);
  }

  function equals() {
    if (op === null || acc === null) return;
    const result = compute(acc, parseFloat(display), op);
    setDisplay(format(result));
    setAcc(null);
    setOp(null);
    setWaiting(true);
  }

  function clearAll() {
    setDisplay("0");
    setAcc(null);
    setOp(null);
    setWaiting(false);
  }

  function backspace() {
    if (waiting || display === "Oops!") return;
    setDisplay(display.length > 1 ? display.slice(0, -1) : "0");
  }

  function toggleSign() {
    if (display === "0" || display === "Oops!") return;
    setDisplay(display.startsWith("-") ? display.slice(1) : `-${display}`);
  }

  function percent() {
    if (display === "Oops!") return;
    setDisplay(format(parseFloat(display) / 100));
  }

  const keyClass = (kind: "fn" | "op" | "eq" | "") =>
    `btn calc-key ${kind === "fn" ? "calc-fn" : ""} ${kind === "op" ? "calc-op" : ""} ${kind === "eq" ? "calc-eq" : ""}`;

  return (
    <div className="screen calc-screen">
      <header className="hub-header">
        <Link to="/hub" className="btn btn-secondary" onClick={() => sfx.tap()}>
          ← Base
        </Link>
        <h1>🧮 Calculator</h1>
        <span />
      </header>

      <div className="panel calc-body">
        <div className="calc-display">
          <span className="calc-pending">{acc !== null && op ? `${format(acc)} ${op}` : " "}</span>
          <span className="calc-value">{display}</span>
        </div>
        <div className="calc-grid">
          <button className={keyClass("fn")} onClick={() => tap(clearAll)}>C</button>
          <button className={keyClass("fn")} onClick={() => tap(toggleSign)}>±</button>
          <button className={keyClass("fn")} onClick={() => tap(percent)}>%</button>
          <button className={keyClass("op")} onClick={() => tap(() => pressOp("÷"))}>÷</button>
          {["7", "8", "9"].map((d) => (
            <button key={d} className={keyClass("")} onClick={() => tap(() => inputDigit(d))}>{d}</button>
          ))}
          <button className={keyClass("op")} onClick={() => tap(() => pressOp("×"))}>×</button>
          {["4", "5", "6"].map((d) => (
            <button key={d} className={keyClass("")} onClick={() => tap(() => inputDigit(d))}>{d}</button>
          ))}
          <button className={keyClass("op")} onClick={() => tap(() => pressOp("−"))}>−</button>
          {["1", "2", "3"].map((d) => (
            <button key={d} className={keyClass("")} onClick={() => tap(() => inputDigit(d))}>{d}</button>
          ))}
          <button className={keyClass("op")} onClick={() => tap(() => pressOp("+"))}>+</button>
          <button className={keyClass("")} onClick={() => tap(() => inputDigit("0"))}>0</button>
          <button className={keyClass("")} onClick={() => tap(() => inputDigit("."))}>.</button>
          <button className={keyClass("fn")} onClick={() => tap(backspace)}>⌫</button>
          <button className={keyClass("eq")} onClick={() => tap(equals)}>=</button>
        </div>
      </div>
    </div>
  );
}
