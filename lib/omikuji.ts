// Shared omikuji logic: used by the page (browser) and the API route (server).

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
export const AGES = ["10代", "20代", "30代", "40代", "50代", "60代以上"] as const;
export const AI_USE = ["毎日使っている", "ときどき使う", "試したことがある", "使ったことがない"] as const;
export const AI_USE_COLS = [...AI_USE, "未回答"] as const;

export const DEFAULT_DEPTS = ["総務", "人事", "経理・財務", "営業", "工事・現場", "設計", "購買・調達", "IT統括部", "その他"];

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
export type FortuneText = Partial<Record<(typeof KEYS)[number], string>>;

const NG_WORDS = ["死", "病", "不幸", "事故", "最悪", "災", "呪", "失敗する"];

const TEMPLATES: Record<(typeof KEYS)[number], string[]> = {
  仕事運: ["積み重ねが実を結ぶとき。", "小さな改善が大きな成果に。", "相談した一言から道がひらける。", "段取り上手が光る一日。"],
  健康運: ["朝の散歩が好調のカギ。", "温かい飲み物でひと休みを。", "早めの就寝で心も軽く。", "深呼吸ひとつで調子が整う。"],
  ひとこと: ["迷ったら、まず一歩。", "笑顔がいちばんのお守り。", "今日の「ありがとう」が明日を照らす。", "焦らず、着実に。"],
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

export type PromptInput = { fortune: string; age: string; gender: string; dept: string };

export function buildPrompt({ fortune, age, gender, dept }: PromptInput): string {
  return `あなたはおみくじ作家です。
運勢：${fortune}　対象：${age || "年齢未回答"}・${gender}　部署：${dept || "未回答"}
仕事運・健康運・ひとことを、各30字以内で前向きな言葉で書いてください。${dept ? "\n仕事運は、その部署の仕事に合う内容にしてください。" : ""}
性別や年齢による決めつけはせず、医療的な助言はしないでください。
出力は次の3行だけにしてください。
仕事運：
健康運：
ひとこと：`;
}

export function templateText(): string {
  return KEYS.map((k) => `${k}：${TEMPLATES[k][Math.floor(rnd() * TEMPLATES[k].length)]}`).join("\n");
}

export function parseFortune(t: string): FortuneText {
  const o: FortuneText = {};
  for (const k of KEYS) {
    const m = t.match(new RegExp("^\\s*" + k + "\\s*[:：]\\s*(.+)$", "m"));
    if (m) o[k] = m[1].trim();
  }
  return o;
}

/** Returns an empty string when the text is OK to print, otherwise the reason it isn't. */
export function checkFortune(o: FortuneText): string {
  if (KEYS.some((k) => !o[k])) return "3項目がそろっていません";
  const long = KEYS.find((k) => [...(o[k] ?? "")].length > 30);
  if (long) return `${long}が30字を超えています`;
  const all = KEYS.map((k) => o[k]).join("");
  const bad = NG_WORDS.find((w) => all.includes(w));
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
