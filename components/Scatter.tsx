"use client";
import { useMemo, type CSSProperties } from "react";

/**
 * Text whose letters start scattered around the screen and fly into place.
 * Letters get their random start once per text (re-renders don't restart them).
 * English words stay together so they don't wrap in the middle.
 * `delay` shifts the whole group (seconds), so blocks can arrive one after another.
 */
export function Scatter({ text, delay = 0, gradient = false }: { text: string; delay?: number; gradient?: boolean }) {
  const words = useMemo(() => {
    const chars = Array.from(text);
    const n = chars.filter((c) => c !== " ").length;
    let i = 0;
    const out: { char: string; style: CSSProperties }[][] = [[]];
    for (const c of chars) {
      if (c === " ") {
        out.push([]);
        continue;
      }
      const r = Math.random;
      const style = {
        "--sx": `${(r() - 0.5) * 90}vw`,
        "--sy": `${(r() - 0.5) * 80}vh`,
        "--sr": `${(r() - 0.5) * 540}deg`,
        "--ss": (0.4 + r() * 1.4).toFixed(2),
        animationDelay: `${(delay + r() * 0.35 + i * 0.015).toFixed(3)}s`,
        // Gradient titles: each letter shows its own slice of one gradient across the word.
        ...(gradient && n > 1 ? { backgroundSize: `${n * 100}% 100%`, backgroundPosition: `${(i / (n - 1)) * 100}% 0` } : {}),
      } as CSSProperties;
      out[out.length - 1].push({ char: c, style });
      i++;
    }
    return out;
  }, [text, delay, gradient]);

  return (
    <span className={gradient ? "scatter grad" : "scatter"}>
      <span className="sr-only">{text}</span>
      <span aria-hidden>
        {words.map((w, wi) => (
          <span key={wi}>
            {wi > 0 && " "}
            <span className="scw">
              {w.map((l, li) => (
                <span key={li} className="scl" style={l.style}>
                  {l.char}
                </span>
              ))}
            </span>
          </span>
        ))}
      </span>
    </span>
  );
}
