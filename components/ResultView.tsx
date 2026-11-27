"use client";
import { useEffect, useState } from "react";
import { decodeResult, type SharedResult } from "@/lib/share";
import { LangProvider, LangToggle } from "@/lib/useLang";
import type { Lang } from "@/lib/i18n";
import { SlipFront, type SlipData } from "./Slip";
import { LogoImage } from "./Logo";

/** The page a visitor opens from the QR code: their own slip, read from the link. */
export function ResultView() {
  const [res, setRes] = useState<SharedResult | null | undefined>(undefined);
  const [lang, setLang] = useState<Lang>("ja");
  useEffect(() => {
    const r = decodeResult(window.location.hash);
    setRes(r);
    if (r && !r.ja && r.en) setLang("en");
  }, []);

  if (res === undefined) return <main className="rview" />;
  if (!res)
    return (
      <main className="rview">
        <LogoImage height={90} />
        <p className="rempty">結果が見つかりませんでした。もう一度QRコードを読み取ってください。</p>
      </main>
    );

  const text = (lang === "en" ? res.en : res.ja) ?? res.ja ?? res.en ?? {};
  const data: SlipData = { fortune: res.f, text, prompt: "", win: res.w, no: res.n, tips: [] };
  return (
    <LangProvider value={lang}>
      <main className="rview" lang={lang}>
        <header className="rhead">
          <LogoImage height={64} />
          {res.ja && res.en && <LangToggle lang={lang} onChange={setLang} />}
        </header>
        <p className="rtitle">{lang === "en" ? "Your fortune" : "あなたのおみくじ"}</p>
        <div className="rslip">
          <SlipFront data={data} />
        </div>
        <p className="rnote">
          {lang === "en"
            ? "Take a screenshot to keep it. Thank you for visiting!"
            : "スクリーンショットで保存できます。ご来場ありがとうございました！"}
        </p>
      </main>
    </LangProvider>
  );
}
