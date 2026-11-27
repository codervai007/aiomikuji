// Packs a result into a URL fragment (#...) so a phone can show it without anything being stored.
// The fragment never reaches the server.
import type { FortuneText } from "./omikuji";
import POOL from "./lines.json";
import { DEFAULT_DEPTS, MATCH_KEY } from "./omikuji";
import { tr } from "./i18n";

// A line that comes from the prepared pools is stored as its number, which keeps the QR code small.
type Compact = Record<string, number | string | number[]>;
// 適職運 is a pattern filled with two job types: stored as [pattern, job, other job].
const matchPool = (lang: "ja" | "en") => (lang === "en" ? POOL.matchEn : POOL.match) as string[];
const fill = (tpl: string, d: string, m: string, lang: "ja" | "en") => tpl.replace("{d}", tr(lang, d)).replace("{m}", tr(lang, m));
const packMatch = (v: string, lang: "ja" | "en"): number[] | null => {
  const pool = matchPool(lang);
  for (let i = 0; i < pool.length; i++)
    for (let a = 0; a < DEFAULT_DEPTS.length; a++)
      for (let b = 0; b < DEFAULT_DEPTS.length; b++) if (fill(pool[i], DEFAULT_DEPTS[a], DEFAULT_DEPTS[b], lang) === v) return [i, a, b];
  return null;
};
const poolOf = (lang: "ja" | "en", key: string): string[] =>
  ((lang === "en" ? POOL.en : POOL.lines) as Record<string, string[]>)[key] ?? [];
const pack = (t: FortuneText | undefined, lang: "ja" | "en"): Compact | undefined => {
  if (!t) return undefined;
  const out: Compact = {};
  for (const [k, v] of Object.entries(t)) {
    if (!v) continue;
    if (k === MATCH_KEY) {
      out[k] = packMatch(v, lang) ?? v;
      continue;
    }
    const i = poolOf(lang, k).indexOf(v);
    out[k] = i >= 0 ? i : v;
  }
  return out;
};
const unpack = (c: Compact | undefined, lang: "ja" | "en"): FortuneText | undefined => {
  if (!c) return undefined;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(c))
    out[k] = Array.isArray(v)
      ? fill(matchPool(lang)[v[0]] ?? "", DEFAULT_DEPTS[v[1]] ?? "", DEFAULT_DEPTS[v[2]] ?? "", lang)
      : typeof v === "number"
        ? (poolOf(lang, k)[v] ?? "")
        : v;
  return out as FortuneText;
};

export type SharedResult = { f: string; n: number; w: boolean; ja?: FortuneText; en?: FortuneText };

const toB64Url = (s: string) => {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};
const fromB64Url = (s: string) => {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
};

// Compact form: [fortune, number, win, ja lines, en lines]; each lines array follows LINE_KEYS.
const FORTUNE_CODES = ["大大吉", "大吉", "中吉"];
const LINE_KEYS = ["仕事運", "健康運", "ひとこと", MATCH_KEY];
type Cell = number | number[] | string | 0;
const toCells = (c: Compact | undefined): Cell[] | 0 => (c ? LINE_KEYS.map((k) => (c[k] ?? 0) as Cell) : 0);
const fromCells = (a: Cell[] | 0): Compact | undefined => {
  if (!a) return undefined;
  const c: Compact = {};
  LINE_KEYS.forEach((k, i) => {
    if (a[i] !== 0 && a[i] !== undefined) c[k] = a[i] as number | number[] | string;
  });
  return c;
};

export function encodeResult(r: SharedResult): string {
  const f = FORTUNE_CODES.indexOf(r.f);
  return toB64Url(JSON.stringify([f >= 0 ? f : r.f, r.n, r.w ? 1 : 0, toCells(pack(r.ja, "ja")), toCells(pack(r.en, "en"))]));
}

export function decodeResult(hash: string): SharedResult | null {
  try {
    const a = JSON.parse(fromB64Url(hash.replace(/^#/, "")));
    if (!Array.isArray(a) || typeof a[1] !== "number") return null;
    const f = typeof a[0] === "number" ? FORTUNE_CODES[a[0]] : a[0];
    if (typeof f !== "string") return null;
    return { f, n: a[1], w: a[2] === 1, ja: unpack(fromCells(a[3]), "ja"), en: unpack(fromCells(a[4]), "en") };
  } catch {
    return null;
  }
}

/** Where the result page lives: this site, or the public site when the booth runs on localhost. */
export function resultBase(): string {
  const fixed = process.env.NEXT_PUBLIC_RESULT_BASE;
  if (fixed) return fixed.replace(/\/$/, "");
  const o = window.location.origin;
  return /localhost|127\.0\.0\.1/.test(o) ? "https://aiomikuji2.vercel.app" : o;
}
