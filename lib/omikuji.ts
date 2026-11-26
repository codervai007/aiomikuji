// Shared omikuji logic: used by the page (browser) and the API route (server).
import { FORTUNE_EN, tr, type Lang } from "./i18n";

export const FORTUNES: [string, number][] = [
  ["大大吉", 10],
  ["大吉", 40],
  ["中吉", 50],
];
export const FORTUNE_NAMES = FORTUNES.map(([f]) => f);

/** File-name slug, furigana and slip colour per fortune. */
export const FORTUNE_INFO: Record<string, { slug: string; reading: string; color: string }> = {
  大大吉: { slug: "daidaikichi", reading: "だいだいきち", color: "#f5cb32" },
  大吉: { slug: "daikichi", reading: "だいきち", color: "#f6c68b" },
  中吉: { slug: "chukichi", reading: "ちゅうきち", color: "#86efac" },
};

export const GENDERS = ["女性", "男性", "その他", "回答しない"] as const;
export const AGES = ["10代", "20代", "30代", "40代", "50代", "60代", "70代以上"] as const;
export const AI_USE = ["毎日使っている", "ときどき使う", "試したことがある", "使ったことがない"] as const;
export const AI_USE_COLS = [...AI_USE, "未回答"] as const;

export const DEFAULT_DEPTS = ["総務", "人事", "経理・財務", "営業", "工場", "工事・現場", "設計", "購買・調達", "IT統括部", "その他"];

export const TIPS = [
  "個人情報・社外秘は入力しない",
  "AIの答えは必ず人が確認する",
  "指示は具体的に（誰に・何を・何字で）",
  "目的や前提を最初に伝える",
  "役割を与える（例：「あなたは総務の担当者です」）",
  "出力の形を指定する（箇条書き・表・3行で など）",
  "お手本の例文を1つ見せると近い形で返ってくる",
  "一度で終わらせず「もっと短く」などと直してもらう",
  "数字・日付・固有名詞は元の資料で確かめる",
  "分からないときは「分からない」と答えてよいと伝える",
  "長い資料は「要点を3つ」のようにまとめ方を指定する",
  "会社で認められたAIツールを使う",
  "AIの答えをそのまま社外に出さない",
  "間違いはどこが違うかを伝えて直してもらう",
  "まずは下書きやアイデア出しから使ってみる",
];

export const KEYS = ["仕事運", "健康運", "ひとこと"] as const;
/** Extra line when the visitor gave a department: another department that suits them. */
export const MATCH_KEY = "適職運";
export type LineKey = (typeof KEYS)[number] | typeof MATCH_KEY;
export type FortuneText = Partial<Record<LineKey, string>>;

const NG_WORDS = ["死", "病", "不幸", "事故", "最悪", "災", "呪", "失敗する"];
const NG_WORDS_EN = ["death", "die ", "dying", "illness", "disease", "disaster", "accident", "curse", "worst", "misfortune", "will fail"];
/** English line names in the AI output, mapped to the internal keys. */
const EN_KEYS: Record<LineKey, string> = { 仕事運: "Work", 健康運: "Health", ひとこと: "Message", 適職運: "Career" };

const TEMPLATES: Record<(typeof KEYS)[number], string[]> = {
  仕事運: ["積み重ねが実を結ぶとき。", "小さな改善が大きな成果に。", "相談した一言から道がひらける。", "段取り上手が光る一日。"],
  健康運: ["朝の散歩が好調のカギ。", "温かい飲み物でひと休みを。", "早めの就寝で心も軽く。", "深呼吸ひとつで調子が整う。"],
  ひとこと: ["迷ったら、まず一歩。", "笑顔がいちばんのお守り。", "今日の「ありがとう」が明日を照らす。", "焦らず、着実に。"],
};
const TEMPLATES_EN: Record<(typeof KEYS)[number], string[]> = {
  仕事運: ["Steady effort is about to pay off.", "A small improvement brings a big result.", "One word of advice opens a new path.", "Your good planning shines today."],
  健康運: ["A morning walk keeps you in top form.", "Take a break with a warm drink.", "An early night lightens body and mind.", "One deep breath sets you right."],
  ひとこと: ["When in doubt, take the first step.", "Your smile is your best charm.", 'Today\'s "thank you" lights up tomorrow.', "No rush. Steady wins."],
};

/** Uniform random number in [0, 1) from the platform's secure generator. */
export function rnd(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296;
}

const K = "〇一二三四五六七八九";
/** 1–100 as kanji numerals: 32 → 三十二. */
export function kan(n: number): string {
  if (n === 100) return "百";
  return (n >= 20 ? K[Math.floor(n / 10)] : "") + (n >= 10 ? "十" : "") + (n % 10 ? K[n % 10] : "");
}

export function drawFortune(): string {
  let r = rnd() * 100;
  for (const [f, w] of FORTUNES) {
    if ((r -= w) < 0) return f;
  }
  return "中吉";
}

/** Removes line breaks and control characters, and caps length, so a value can't add instructions to the prompt. */
export function cleanField(v: unknown, max = 20): string {
  return String(v ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .trim()
    .slice(0, max);
}

export type PromptInput = { fortune: string; age: string; gender: string; dept: string; match?: string; lang?: Lang };

/** Picks, at random, another department from the list that "also suits" the visitor. */
export function pickMatch(depts: string[], dept: string): string {
  const pool = depts.filter((d) => d !== dept && d !== "その他" && d !== "回答しない");
  return dept && pool.length ? pool[Math.floor(rnd() * pool.length)] : "";
}

export function buildPrompt({ fortune, age, gender, dept, match, lang = "ja" }: PromptInput): string {
  const withMatch = Boolean(dept && match);
  if (lang === "en") {
    const d = tr("en", dept);
    const m = tr("en", match ?? "");
    return `You are an omikuji (Japanese fortune slip) writer.
Fortune: ${fortune} (${FORTUNE_EN[fortune]?.name ?? ""})  Visitor: ${age ? tr("en", age) : "age not given"} · ${tr("en", gender)}  Department: ${d || "not given"}${withMatch ? `  Matching department: ${m}` : ""}
Write Work, Health and Message in English, each one positive sentence of at most 80 characters.${dept ? "\nMake Work fit the work of that department." : ""}${
      withMatch ? `\nFor Career, say that someone in ${d} would also do well in ${m}, with a positive reason, in at most 110 characters. Always include "${m}".` : ""
    }
Don't make assumptions based on gender or age, and give no medical advice.
Output only these ${withMatch ? 4 : 3} lines:
Work:
Health:
Message:${withMatch ? "\nCareer:" : ""}`;
  }
  return `あなたはおみくじ作家です。
運勢：${fortune}　対象：${age || "年齢未回答"}・${gender}　部署：${dept || "未回答"}${withMatch ? `　相性のいい部署：${match}` : ""}
仕事運・健康運・ひとことを、各30字以内で前向きな言葉で書いてください。${dept ? "\n仕事運は、その部署の仕事に合う内容にしてください。" : ""}${
    withMatch ? `\n適職運は「${dept}のあなたは、${match}にも向いています」という内容を、前向きな理由を添えて40字以内で書いてください。「${match}」を必ず入れてください。` : ""
  }
性別や年齢による決めつけはせず、医療的な助言はしないでください。
出力は次の${withMatch ? 4 : 3}行だけにしてください。
仕事運：
健康運：
ひとこと：${withMatch ? "\n適職運：" : ""}`;
}

const MATCH_TEMPLATES = ["の経験が、{m}でも活きそう。", "で鍛えた力は、{m}でも光ります。", "のあなたは、{m}にも向いています。"];

const MATCH_TEMPLATES_EN = ["Your experience in {d} will shine in {m} too.", "The skills you built in {d} would serve you well in {m}.", "Someone from {d} like you would also do well in {m}."];

export function templateText(dept = "", match = "", lang: Lang = "ja"): string {
  if (lang === "en") {
    const lines = KEYS.map((k) => `${EN_KEYS[k]}: ${TEMPLATES_EN[k][Math.floor(rnd() * TEMPLATES_EN[k].length)]}`);
    if (dept && match)
      lines.push(`Career: ${MATCH_TEMPLATES_EN[Math.floor(rnd() * MATCH_TEMPLATES_EN.length)].replace("{d}", tr("en", dept)).replace("{m}", tr("en", match))}`);
    return lines.join("\n");
  }
  const lines = KEYS.map((k) => `${k}：${TEMPLATES[k][Math.floor(rnd() * TEMPLATES[k].length)]}`);
  if (dept && match) lines.push(`${MATCH_KEY}：${dept}${MATCH_TEMPLATES[Math.floor(rnd() * MATCH_TEMPLATES.length)].replace("{m}", match)}`);
  return lines.join("\n");
}

export function parseFortune(t: string, lang: Lang = "ja"): FortuneText {
  const o: FortuneText = {};
  for (const k of [...KEYS, MATCH_KEY] as LineKey[]) {
    const name = lang === "en" ? EN_KEYS[k] : k;
    const m = t.match(new RegExp("^\\s*\\**" + name + "\\**\\s*[:：]\\s*(.+)$", lang === "en" ? "mi" : "m"));
    if (m) o[k] = m[1].trim();
  }
  return o;
}

/** Returns an empty string when the text is OK to print, otherwise the reason it isn't. */
export function checkFortune(o: FortuneText, match = "", lang: Lang = "ja"): string {
  const en = lang === "en";
  const max = en ? 100 : 30;
  if (KEYS.some((k) => !o[k])) return "3項目がそろっていません";
  const long = KEYS.find((k) => [...(o[k] ?? "")].length > max);
  if (long) return `${long}が${max}字を超えています`;
  if (match) {
    const m = o[MATCH_KEY] ?? "";
    const name = tr(lang, match);
    if (!m) return "適職運がありません";
    if (!m.toLowerCase().includes(name.toLowerCase())) return `適職運に「${name}」が入っていません`;
    if ([...m].length > (en ? 140 : 45)) return "適職運が長すぎます";
  }
  const all = ([...KEYS, MATCH_KEY] as LineKey[]).map((k) => o[k] ?? "").join(en ? " " : "").toLowerCase() + " ";
  const bad = (en ? NG_WORDS_EN : NG_WORDS).find((w) => all.includes(w));
  if (bad) return `不適切な表現「${bad}」を検出`;
  return "";
}

export function chooseTips(selected: number[], mode: "random" | "fixed"): string[] {
  const pool = [...selected];
  for (const b of [0, 1, 2]) if (pool.length < 3 && !pool.includes(b)) pool.push(b);
  if (mode === "fixed") return pool.slice(0, 3).map((i) => TIPS[i]);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool
    .slice(0, 3)
    .sort((a, b) => a - b)
    .map((i) => TIPS[i]);
}
