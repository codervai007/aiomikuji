"use client";
import { createContext, useContext } from "react";
import { tr, type Lang } from "./i18n";

const LangContext = createContext<Lang>("ja");
export const LangProvider = LangContext.Provider;

/** Current language plus a translate function for components inside the kiosk. */
export function useLang() {
  const lang = useContext(LangContext);
  return { lang, t: (ja: string) => tr(lang, ja) };
}

export function LangToggle({ lang, onChange, className = "" }: { lang: Lang; onChange: (l: Lang) => void; className?: string }) {
  return (
    <div className={`langtoggle ${className}`} role="group" aria-label="言語 / Language">
      <button type="button" aria-pressed={lang === "ja"} className={lang === "ja" ? "on" : ""} onClick={() => onChange("ja")}>
        日本語
      </button>
      <button type="button" aria-pressed={lang === "en"} className={lang === "en" ? "on" : ""} onClick={() => onChange("en")}>
        English
      </button>
    </div>
  );
}
