"use client";
import { useEffect, useRef } from "react";
import { kan } from "@/lib/omikuji";

const NUMS = Array.from({ length: 100 }, (_, i) => i + 1);

/** The shrine cabinet: roof, 御神籤 plate and 100 drawers. */
export function Cabinet({ pick, onPick, pullTick }: { pick: number | null; onPick: (n: number) => void; pullTick: number }) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  // Replay the "pull out" animation on the picked drawer each time a draw starts.
  useEffect(() => {
    if (!pullTick || pick == null) return;
    const el = refs.current[pick - 1];
    if (!el) return;
    el.classList.remove("open");
    void el.offsetWidth;
    el.classList.add("open");
  }, [pullTick]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="shrine">
      <svg className="roof" viewBox="0 0 600 58" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 52 Q70 48 110 28 L300 4 L490 28 Q530 48 600 52 L600 58 L0 58Z" fill="#2a211d" />
        <path d="M110 28 L300 4 L490 28" fill="none" stroke="#d9b46a" strokeWidth="3" />
        <rect x="0" y="52" width="600" height="6" fill="#d9b46a" />
      </svg>
      <div className="body">
        <div className="plate">御神籤</div>
        <div className="cab" role="group" aria-label="引き出し 1〜100">
          {NUMS.map((n) => (
            <button
              key={n}
              ref={(el) => {
                refs.current[n - 1] = el;
              }}
              type="button"
              className="dr"
              aria-pressed={pick === n}
              aria-label={`${n}番`}
              onClick={() => onPick(n)}
            >
              <span className="k">{kan(n)}</span>
              <span className="a">{n}</span>
              <i />
            </button>
          ))}
        </div>
      </div>
      <div className="base" />
    </div>
  );
}
