"use client";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { encodeResult, resultBase } from "@/lib/share";
import { useLang } from "@/lib/useLang";
import type { SlipData } from "./Slip";

/** Little shrine-fox face shown in the middle of the QR code (original design). */
function FoxFace() {
  return (
    <svg className="qrface" viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="50" r="48" fill="#fff" />
      <path d="M22 30 L30 8 L44 26 Z" fill="#fff" stroke="#e0562a" strokeWidth="3" strokeLinejoin="round" />
      <path d="M78 30 L70 8 L56 26 Z" fill="#fff" stroke="#e0562a" strokeWidth="3" strokeLinejoin="round" />
      <path d="M27 26 L31 15 L38 24 Z M73 26 L69 15 L62 24 Z" fill="#ff8a5c" />
      <path d="M50 24 C70 24 80 36 80 50 C80 62 70 70 60 74 L50 82 L40 74 C30 70 20 62 20 50 C20 36 30 24 50 24 Z" fill="#fff" stroke="#e0562a" strokeWidth="3" />
      <path d="M33 47 Q38 42 43 47 M57 47 Q62 42 67 47" fill="none" stroke="#2a1a12" strokeWidth="3.4" strokeLinecap="round" />
      <path d="M31 40 Q36 35 42 38 M69 40 Q64 35 58 38" fill="none" stroke="#e0562a" strokeWidth="3" strokeLinecap="round" />
      <circle cx="50" cy="35" r="3" fill="#e0562a" />
      <path d="M46 60 Q50 57 54 60 Q52 65 50 65 Q48 65 46 60 Z" fill="#2a1a12" />
      <ellipse cx="34" cy="58" rx="5" ry="3" fill="#ffb3a0" opacity=".8" />
      <ellipse cx="66" cy="58" rx="5" ry="3" fill="#ffb3a0" opacity=".8" />
    </svg>
  );
}

/** QR code on the result screen, dressed as a shrine fox: scan it to see this slip on your phone. */
export function ResultQr({ slip }: { slip: SlipData | null }) {
  const { t } = useLang();
  const [src, setSrc] = useState("");
  const [href, setHref] = useState("");
  useEffect(() => {
    if (!slip) return setSrc("");
    const hash = encodeResult({ f: slip.fortune, n: slip.no, w: slip.win, ja: slip.alt?.ja ?? slip.text, en: slip.alt?.en });
    const url = `${resultBase()}/r#${hash}`;
    setHref(url);
    // "H" error correction keeps the code readable with the fox face on top of it.
    QRCode.toDataURL(url, { margin: 1, width: 480, errorCorrectionLevel: "H", color: { dark: "#2a1209", light: "#ffffff" } })
      .then(setSrc)
      .catch(() => setSrc(""));
  }, [slip]);
  if (!src) return null;
  return (
    <div className="resqr">
      <div className="qrfox">
        <svg className="qrears" viewBox="0 0 200 60" aria-hidden="true">
          <path d="M18 60 L40 4 Q44 -2 50 4 L86 60 Z" fill="#ff7a3d" />
          <path d="M34 60 L44 22 L66 60 Z" fill="#fff1e6" />
          <path d="M182 60 L160 4 Q156 -2 150 4 L114 60 Z" fill="#ff7a3d" />
          <path d="M166 60 L156 22 L134 60 Z" fill="#fff1e6" />
        </svg>
        <div className="qrbox">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={t("スマホで結果を見る")} data-href={href} />
          <FoxFace />
        </div>
        <svg className="qrtail" viewBox="0 0 60 120" aria-hidden="true">
          <path d="M4 110 C40 100 58 70 50 38 C46 20 34 8 22 4 C34 22 30 40 18 52 C8 62 2 84 4 110 Z" fill="#ff7a3d" />
          <path d="M22 4 C34 8 44 18 48 30 C40 26 32 26 26 30 C30 20 28 12 22 4 Z" fill="#fff1e6" />
        </svg>
      </div>
      <p>
        <b>{t("スマホで結果を見る")}</b>
        {t("QRコードを読み取ると、このおみくじをスマホで見られます。")}
      </p>
    </div>
  );
}
