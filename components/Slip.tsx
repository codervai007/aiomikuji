"use client";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { FORTUNE_INFO, KEYS, MATCH_KEY, kan, type FortuneText, type LineKey } from "@/lib/omikuji";
import { FortuneArt } from "./FortuneArt";

export type SlipData = { fortune: string; text: FortuneText; prompt: string; win: boolean; no: number; tips: string[] };

export const GUIDE_URL = process.env.NEXT_PUBLIC_GUIDE_URL || "";

const ITEM_STYLE: Record<LineKey, { icon: string; color: string }> = {
  仕事運: { icon: "仕", color: "#1d86cf" },
  健康運: { icon: "健", color: "#0bbf5c" },
  ひとこと: { icon: "言", color: "#f08a1c" },
  適職運: { icon: "適", color: "#7b4fd6" },
};

/** The lines to show: the three base lines, plus 適職運 when present. */
const linesOf = (t: FortuneText): LineKey[] => (t[MATCH_KEY] ? [...KEYS, MATCH_KEY] : [...KEYS]);

/** QR code for the AI guide page (only when NEXT_PUBLIC_GUIDE_URL is set). */
export function useGuideQr() {
  const [src, setSrc] = useState("");
  useEffect(() => {
    if (!GUIDE_URL) return;
    QRCode.toDataURL(GUIDE_URL, { margin: 1, width: 240, color: { dark: "#111827", light: "#ffffff" } })
      .then(setSrc)
      .catch(() => setSrc(""));
  }, []);
  return src;
}

export function FortuneName({ fortune }: { fortune: string }) {
  return (
    <ruby>
      {fortune}
      <rp>（</rp>
      <rt>{FORTUNE_INFO[fortune]?.reading}</rt>
      <rp>）</rp>
    </ruby>
  );
}

export function SlipFront({ data }: { data: SlipData }) {
  return (
    <article className={data.win ? "slip win" : "slip"} aria-label="おみくじ 表面">
      <div className="sliphd">
        <span className="tag">AIおみくじ</span>
        <span className="tag mincho">第{kan(data.no)}番</span>
      </div>
      <div className="luckbox" style={{ background: FORTUNE_INFO[data.fortune]?.color ?? "#fef3dc" }}>
        <FortuneArt fortune={data.fortune} className="art" />
        <div className="lt">
          <span>運勢</span>
          <b className={data.fortune.length > 2 ? "long" : undefined}>
            <FortuneName fortune={data.fortune} />
          </b>
        </div>
      </div>
      <ul className="items">
        {linesOf(data.text).map((k) => (
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
  );
}

export function SlipBack({ data, qr }: { data: SlipData; qr: string }) {
  return (
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
      <div className="contact">
        <p>
          <b>相談窓口</b>IT統括部 アプリケーションサポート
          <br />
          業務でAIを試したいときは気軽にご相談ください
        </p>
        {qr && <img src={qr} alt="AI活用ガイドのQRコード" width={76} height={76} />}
      </div>
    </article>
  );
}

export function SlipEmpty({ text }: { text: string }) {
  return (
    <div className="slip empty">
      <div className="ph">
        <span className="phnum">?</span>
        <p>{text}</p>
      </div>
    </div>
  );
}

/** Black-and-white layout for an 80 mm thermal printer; only shown when printing. */
export function PrintSlip({ data, qr }: { data: SlipData | null; qr: string }) {
  if (!data) return null;
  return (
    <div className="printarea" aria-hidden="true">
      <p className="p-title">AIおみくじ　第{kan(data.no)}番</p>
      <p className="p-read">{FORTUNE_INFO[data.fortune]?.reading}</p>
      <p className="p-luck">{data.fortune}</p>
      {linesOf(data.text).map((k) => (
        <p key={k} className="p-item">
          <b>【{k}】</b>
          {data.text[k]}
        </p>
      ))}
      {data.win && <p className="p-win">★ 当たり ★ マグカップ当選！この紙をスタッフにお見せください</p>}
      <hr />
      <p className="p-h">この紙を作った指示文</p>
      <pre className="p-pre">{data.prompt}</pre>
      <p className="p-h">AIを仕事で使うコツ</p>
      {data.tips.map((t) => (
        <p key={t} className="p-item">
          ・{t}
        </p>
      ))}
      <hr />
      <p className="p-item">相談窓口：IT統括部 アプリケーションサポート</p>
      {qr && <img src={qr} alt="" className="p-qr" />}
      <p className="p-foot">IT Connect Fes 2026</p>
    </div>
  );
}
