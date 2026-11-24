"use client";
import { useSettings } from "@/lib/useSettings";

/** Light / dark switch; the choice is shared with the kiosk and monitor in this browser. */
export function ThemeToggle() {
  const [st, setSt] = useSettings();
  return (
    <button className="btn themebtn" onClick={() => setSt((s) => ({ ...s, theme: s.theme === "dark" ? "light" : "dark", themeV: 2 }))}>
      {st.theme === "dark" ? "ライトモード" : "ダークモード"}
    </button>
  );
}
