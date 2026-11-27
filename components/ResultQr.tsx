"use client";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { encodeResult, resultBase } from "@/lib/share";
import { useLang } from "@/lib/useLang";
import type { SlipData } from "./Slip";

/** QR code on the result screen: scan it to see this slip on your phone. */
export function ResultQr({ slip }: { slip: SlipData | null }) {
  const { t } = useLang();
  const [src, setSrc] = useState("");
  const [href, setHref] = useState("");
  useEffect(() => {
    if (!slip) return setSrc("");
    const hash = encodeResult({ f: slip.fortune, n: slip.no, w: slip.win, ja: slip.alt?.ja ?? slip.text, en: slip.alt?.en });
    const url = `${resultBase()}/r#${hash}`;
    setHref(url);
    QRCode.toDataURL(url, { margin: 1, width: 320, errorCorrectionLevel: "L", color: { dark: "#111111", light: "#ffffff" } })
      .then(setSrc)
      .catch(() => setSrc(""));
  }, [slip]);
  if (!src) return null;
  return (
    <div className="resqr">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={t("スマホで結果を見る")} width={150} height={150} data-href={href} />
      <p>
        <b>{t("スマホで結果を見る")}</b>
        {t("QRコードを読み取ると、このおみくじをスマホで見られます。")}
      </p>
    </div>
  );
}
