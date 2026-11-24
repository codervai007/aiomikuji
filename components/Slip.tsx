"use client";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { FORTUNE_INFO, KEYS, MATCH_KEY, kan, type FortuneText, type LineKey } from "@/lib/omikuji";
import { FortuneArt } from "./FortuneArt";
import { FORTUNE_EN } from "@/lib/i18n";
import { useLang } from "@/lib/useLang";

export type SlipData = { fortune: string; text: FortuneText; prompt: string; win: boolean; no: number; tips: string[] };

export const GUIDE_URL = process.env.NEXT_PUBLIC_GUIDE_URL || "";

const ITEM_STYLE: Record<LineKey, { icon: string; en: string; color: string }> = {
  仕事運: { icon: "仕", en: "W", color: "#1d86cf" },
  健康運: { icon: "健", en: "H", color: "#0bbf5c" },
  ひとこと: { icon: "言", en: "M", color: "#f08a1c" },
  適職運: { icon: "適", en: "C", color: "#7b4fd6" },
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

/** "No. 32" in English, 第三十二番 in Japanese. */
export function useNo() {
  const { lang } = useLang();
  return (n: number) => (lang === "en" ? `No. ${n}` : `第${kan(n)}番`);
}

export function FortuneName({ fortune }: { fortune: string }) {
  const { lang } = useLang();
  return (
    <ruby>
      {fortune}
      <rp>（</rp>
      <rt>{lang === "en" ? FORTUNE_EN[fortune]?.romaji : FORTUNE_INFO[fortune]?.reading}</rt>
      <rp>）</rp>
    </ruby>
  );
}

export function SlipFront({ data }: { data: SlipData }) {
  const { lang, t } = useLang();
  const no = useNo();
  return (
    <article className={data.win ? "slip win" : "slip"} aria-label="おみくじ 表面">
      <div className="sliphd">
        <span className="tag">{t("AIおみくじ")}</span>
        <span className="tag mincho">{no(data.no)}</span>
      </div>
      <div className="luckbox" style={{ background: FORTUNE_INFO[data.fortune]?.color ?? "#fef3dc" }}>
        <FortuneArt fortune={data.fortune} className="art" />
        <div className="lt">
          <span>{t("運勢")}</span>
          <b className={data.fortune.length > 2 ? "long" : undefined}>
            <FortuneName fortune={data.fortune} />
          </b>
          {lang === "en" && <small className="lucken">{FORTUNE_EN[data.fortune]?.name}</small>}
        </div>
      </div>
      <ul className="items">
        {linesOf(data.text).map((k) => (
          <li key={k}>
            <span className="ic" style={{ background: ITEM_STYLE[k].color }}>
              {lang === "en" ? ITEM_STYLE[k].en : ITEM_STYLE[k].icon}
            </span>
            <div>
              <span className="lbl">{t(k)}</span>
              <p>{data.text[k]}</p>
            </div>
          </li>
        ))}
      </ul>
      {data.win && (
        <>
          <div className="winbadge" aria-hidden="true">
            {t("当たり！")}
          </div>
          <p className="wincall">
            <b>{t("マグカップ当選")}</b>
            {t("この紙をスタッフにお見せください")}
          </p>
        </>
      )}
      <p className="slipft">{t("IT Connect Fes 2026 ・ IT統括部")}</p>
    </article>
  );
}

export function SlipBack({ data, qr }: { data: SlipData; qr: string }) {
  const { t } = useLang();
  return (
    <article className="slip back" aria-label="おみくじ 裏面">
      <div className="sliphd">
        <span className="tag">{t("裏面")}</span>
        <span className="tag">{t("AIミニ解説")}</span>
      </div>
      <h4>{t("あなたのおみくじを作った指示文")}</h4>
      <pre>{data.prompt}</pre>
      <h4>{t("AIを仕事で使うコツ")}</h4>
      <ul className="tiplist">
        {data.tips.map((tip) => (
          <li key={tip}>{t(tip)}</li>
        ))}
      </ul>
      <div className="contact">
        <p>
          <b>{t("相談窓口")}</b>
          {t("IT統括部 アプリケーションサポート")}
          <br />
          {t("業務でAIを試したいときは気軽にご相談ください")}
        </p>
        {qr && <img src={qr} alt={t("AI活用ガイドのQRコード")} width={76} height={76} />}
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
  const { lang, t } = useLang();
  const no = useNo();
  if (!data) return null;
  const en = lang === "en";
  return (
    <div className="printarea" aria-hidden="true">
      <p className="p-title">
        {t("AIおみくじ")}　{no(data.no)}
      </p>
      <p className="p-read">{en ? FORTUNE_EN[data.fortune]?.romaji : FORTUNE_INFO[data.fortune]?.reading}</p>
      <p className="p-luck">{data.fortune}</p>
      {en && <p className="p-read">{FORTUNE_EN[data.fortune]?.name}</p>}
      {linesOf(data.text).map((k) => (
        <p key={k} className="p-item">
          <b>【{t(k)}】</b>
          {data.text[k]}
        </p>
      ))}
      {data.win && <p className="p-win">{en ? "★ WIN ★ You won a mug! Show this slip to a staff member" : "★ 当たり ★ マグカップ当選！この紙をスタッフにお見せください"}</p>}
      <hr />
      <p className="p-h">{t("この紙を作った指示文")}</p>
      <pre className="p-pre">{data.prompt}</pre>
      <p className="p-h">{t("AIを仕事で使うコツ")}</p>
      {data.tips.map((tip) => (
        <p key={tip} className="p-item">
          ・{t(tip)}
        </p>
      ))}
      <hr />
      <p className="p-item">
        {t("相談窓口")}：{t("IT統括部 アプリケーションサポート")}
      </p>
      {qr && <img src={qr} alt="" className="p-qr" />}
      <p className="p-foot">IT Connect Fes 2026</p>
    </div>
  );
}
