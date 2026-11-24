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
  sound: boolean;
  autoPrint: boolean;
  resetSeconds: number;
  theme: "light" | "dark";
  /** 2 = the theme was chosen on purpose (dark is the default otherwise). */
  themeV: number;
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
  sound: true,
  autoPrint: false,
  resetSeconds: 20,
  theme: "dark",
  themeV: 2,
};

export const SETTINGS_KEY = "omikuji-booth-v3";

export function sanitize(raw: unknown): Settings {
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
    sound: s.sound !== false,
    autoPrint: s.autoPrint === true,
    resetSeconds: Math.min(120, Math.max(5, num(s.resetSeconds, 20))),
    // The booth always runs in the dark theme.
    theme: "dark",
    themeV: 2,
  };
}

/**
 * Booth settings and survey log, kept in this browser's localStorage and kept in
 * step across the kiosk, monitor and staff windows open in the same browser.
 */
export function useSettings() {
  const [st, setSt] = useState<Settings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) setSt(sanitize(JSON.parse(saved)));
    } catch {
      /* storage unavailable: run with defaults */
    }
    setLoaded(true);
    const onStorage = (e: StorageEvent) => {
      if (e.key !== SETTINGS_KEY || !e.newValue) return;
      try {
        setSt(sanitize(JSON.parse(e.newValue)));
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    document.documentElement.dataset.theme = "dark";
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(st));
    } catch {
      /* ignore */
    }
  }, [st, loaded]);

  return [st, setSt] as const;
}
