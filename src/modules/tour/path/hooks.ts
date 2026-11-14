import { useCallback, useEffect, useRef, useState } from "react";
import { pathAmplitude } from "./layout";

/** Sideways swing of the trail, kept in step with the viewport width. */
export function usePathAmp(): number {
  const [amp, setAmp] = useState(() => pathAmplitude(window.innerWidth));
  useEffect(() => {
    const onResize = () => setAmp(pathAmplitude(window.innerWidth));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return amp;
}

export interface Toast {
  id: number;
  text: string;
}

/** One short line that fades away by itself (Pogo's little nudges). */
export function useToast(ms = 2000): [Toast | null, (text: string) => void] {
  const [toast, setToast] = useState<Toast | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const count = useRef(0);

  const show = useCallback((text: string) => {
    window.clearTimeout(timer.current);
    count.current += 1;
    setToast({ id: count.current, text });
    timer.current = window.setTimeout(() => setToast(null), ms);
  }, [ms]);

  useEffect(() => () => window.clearTimeout(timer.current), []);
  return [toast, show];
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
