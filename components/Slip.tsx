"use client";
import { KEYS, kan, type FortuneText } from "@/lib/omikuji";

export type SlipData = { fortune: string; text: FortuneText; prompt: string; win: boolean; no: number; tips: string[] };

/** The printed slip: front (vertical omikuji) and back (prompt + AI tips). */
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

      {!data || printing ? (
        <div className="slip">
          <div className="frame empty">{printing ? "印刷中…" : "引き出しを選んで、おみくじを引いてください"}</div>
        </div>
      ) : side === "front" ? (
        <article className="slip" aria-label="おみくじ 表面">
          <div className="frame">
            <p className="t">AIおみくじ</p>
            <p className="no">第{kan(data.no)}番</p>
            <p className="luck">{data.fortune}</p>
            {KEYS.map((k) => (
              <p className="it" key={k}>
                <b>{k}</b>　{data.text[k]}
              </p>
            ))}
            {data.win && (
              <p className="it" style={{ color: "#c8372d" }}>
                <b>当たり</b>　この紙をスタッフにお見せください
              </p>
            )}
          </div>
          {data.win && (
            <div className="seal" aria-label="当たり">
              当選<small>マグカップ贈呈</small>
            </div>
          )}
        </article>
      ) : (
        <article className="slip back" aria-label="おみくじ 裏面">
          <h3>あなたのおみくじを作った指示文</h3>
          <pre>{data.prompt}</pre>
          <h3>AIを仕事で使うコツ</h3>
          <ol>
            {data.tips.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ol>
          <p className="foot">
            相談窓口　IT統括部 アプリケーションサポート
            <br />
            業務でAIを試したいときは気軽にご相談ください
          </p>
        </article>
      )}
      <p className="slipnote">当日はブースのサーマルプリンターで印刷してお渡しします</p>
    </section>
  );
}
