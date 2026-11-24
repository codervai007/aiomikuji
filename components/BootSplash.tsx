"use client";
import { useEffect } from "react";

/** Hides the loading screen (#boot, rendered in the layout) once the page, fonts and first video are ready. */
export function BootSplash() {
  useEffect(() => {
    const el = document.getElementById("boot");
    if (!el) return;
    const start = performance.now();
    let done = false;
    const hide = () => {
      if (done) return;
      done = true;
      const wait = Math.max(0, 900 - (performance.now() - start)); // show the logo at least briefly
      setTimeout(() => {
        el.classList.add("boot-out");
        setTimeout(() => el.remove(), 700);
      }, wait);
    };
    const pageReady = new Promise<void>((r) => (document.readyState === "complete" ? r() : window.addEventListener("load", () => r(), { once: true })));
    const fontsReady = document.fonts?.ready ?? Promise.resolve();
    const v = document.querySelector<HTMLVideoElement>("video");
    const videoReady = new Promise<void>((r) => {
      if (!v || v.readyState >= 3) return r();
      v.addEventListener("canplay", () => r(), { once: true });
      v.addEventListener("error", () => r(), { once: true });
    });
    Promise.all([pageReady, fontsReady, videoReady]).then(hide);
    const safety = setTimeout(hide, 6000);
    return () => clearTimeout(safety);
  }, []);
  return null;
}
