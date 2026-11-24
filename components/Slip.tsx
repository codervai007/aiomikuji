"use client";
import { KEYS, kan, type FortuneText } from "@/lib/omikuji";
import { Sparkle } from "./Art";
import { FortuneArt } from "./FortuneArt";

export type SlipData = { fortune: string; text: FortuneText; prompt: string; win: boolean; no: number; tips: string[] };

/** Background colour of the fortune box, from luckiest to least. */
const FORTUNE_COLOR: Record<string, string> = {
  大大吉: "#f5cb32",
  大吉: "#f6c68b",
  中吉: "#86efac",
  吉: "#c4e0f2",
  小吉: "#fbcfe8",
  末吉: "#ddd6fe",
};

/** Furigana for each fortune. */
const READING: Record<string, string> = {
  大大吉: "だいだいきち",
  大吉: "だいきち",
  中吉: "ちゅうきち",
  吉: "きち",
  小吉: "しょうきち",
  末吉: "すえきち",
};

const ITEM_STYLE: Record<(typeof KEYS)[number], { icon: string; color: string }> = {
  仕事運: { icon: "仕", color: "#1d86cf" },
  健康運: { icon: "健", color: "#0bbf5c" },
  ひとこと: { icon: "言", color: "#f08a1c" },
};

/** The printed slip: front (fortune) and back (prompt + AI tips). */
export function Slip({
  data,
  side,
  onSide,
  printing,
}: {
  data: SlipData | null;
  side: "front" | "back";
  onSide: (s: "front" | "back") => void;
  printing: boolean;
}) {
  return (
    <section className="slipcol" aria-label="おみくじ">
      <div className="sides">
        <button aria-pressed={side === "front"} onClick={() => onSide("front")}>
          表
        </button>
        <button aria-pressed={side === "back"} onClick={() => onSide("back")}>
          裏 ・ AIミニ解説
        </button>
      </div>

      <div className="slipwrap">
        <Sparkle className="sp4" color="#e9525c" />
        <Sparkle className="sp5" color="#86efac" />

        {!data || printing ? (
          <div className="slip empty">
            <div className="ph">
              <span className="phnum">{printing ? "…" : "?"}</span>
              <p>{printing ? "AIがおみくじを書いています…" : "引き出しを選んで、おみくじを引いてください"}</p>
            </div>
          </div>
        ) : side === "front" ? (
          <article className={data.win ? "slip win" : "slip"} aria-label="おみくじ 表面">
            <div className="sliphd">
              <span className="tag">AIおみくじ</span>
              <span className="tag">第{kan(data.no)}番</span>
            </div>

            <div className="luckbox" style={{ background: FORTUNE_COLOR[data.fortune] ?? "#fef3dc" }}>
              <FortuneArt fortune={data.fortune} className="art" />
              <div className="lt">
                <span>運勢</span>
                <b className={data.fortune.length > 2 ? "long" : undefined}>
                  <ruby>
                    {data.fortune}
                    <rp>（</rp>
                    <rt>{READING[data.fortune]}</rt>
                    <rp>）</rp>
                  </ruby>
                </b>
              </div>
            </div>

            <ul className="items">
              {KEYS.map((k) => (
                <li key={k}>
                  <span className="ic" style={{ background: ITEM_STYLE[k].color }}>
                    {ITEM_STYLE[k].icon}
                  </span>
                  <div>
                    <span className="lbl">{k}</span>
                    <p>{data.text[k]}</p>
                  </div>
                </li>
              ))}
            </ul>

            {data.win && (
              <>
                <div className="winbadge" aria-hidden="true">
                  当たり！
                </div>
                <p className="wincall">
                  <b>マグカップ当選</b>この紙をスタッフにお見せください
                </p>
              </>
            )}

            <p className="slipft">IT Connect Fes 2026 ・ IT統括部</p>
          </article>
        ) : (
          <article className="slip back" aria-label="おみくじ 裏面">
            <div className="sliphd">
              <span className="tag">裏面</span>
              <span className="tag">AIミニ解説</span>
            </div>
            <h4>あなたのおみくじを作った指示文</h4>
            <pre>{data.prompt}</pre>
            <h4>AIを仕事で使うコツ</h4>
            <ul className="tiplist">
              {data.tips.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
            <p className="contact">
              <b>相談窓口</b>IT統括部 アプリケーションサポート
              <br />
              業務でAIを試したいときは気軽にご相談ください
            </p>
          </article>
        )}
      </div>
      <p className="slipnote">当日はブースのプリンターで印刷してお渡しします</p>
    </section>
  );
}
