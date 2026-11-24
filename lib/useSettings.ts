"use client";
import { useEffect, useState } from "react";
import { DEFAULT_DEPTS, TIPS } from "./omikuji";

export type LogRow = { t: number; dept: string; ai: string; f: string; win: boolean };
export type Settings = {
  expected: number;
  mugs: number;
  drawn: number;
  won: number;
  tips: number[];
  tipMode: "random" | "fixed";
  depts: string[];
  log: LogRow[];
};

export const DEFAULT_SETTINGS: Settings = {
  expected: 200,
  mugs: 10,
  drawn: 0,
  won: 0,
  tips: TIPS.map((_, i) => i),
  tipMode: "random",
  depts: DEFAULT_DEPTS,
  log: [],
};

const KEY = "omikuji-booth-v3";

function sanitize(raw: unknown): Settings {
  const s = { ...DEFAULT_SETTINGS, ...(raw && typeof raw === "object" ? raw : {}) } as Settings;
  const num = (v: unknown, d: number) => (Number.isFinite(Number(v)) ? Math.max(0, Math.floor(Number(v))) : d);
  return {
    expected: Math.max(1, num(s.expected, 200)),
    mugs: Math.min(50, num(s.mugs, 10)),
    drawn: num(s.drawn, 0),
    won: num(s.won, 0),
    tips: Array.isArray(s.tips) ? s.tips.filter((i) => Number.isInteger(i) && i >= 0 && i < TIPS.length) : DEFAULT_SETTINGS.tips,
    tipMode: s.tipMode === "fixed" ? "fixed" : "random",
    depts: Array.isArray(s.depts) && s.depts.length ? s.depts.map(String).slice(0, 40) : DEFAULT_DEPTS,
    log: Array.isArray(s.log) ? s.log.slice(-3000) : [],
  };
}

/** Booth settings and survey log, kept in this browser's localStorage. */
export function useSettings() {
  const [st, setSt] = useState<Settings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved) setSt(sanitize(JSON.parse(saved)));
    } catch {
      /* storage unavailable: run with defaults */
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(st));
    } catch {
      /* ignore */
    }
  }, [st, loaded]);

  return [st, setSt] as const;
}
