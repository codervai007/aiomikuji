"use client";
import { useState } from "react";

/** Dimmed looping background video. Uses /media/bg.mp4, else the home background, else the start loop. */
const SOURCES = ["/media/bg.mp4", "/media/home-bg.mp4", "/media/idle.mp4"];

export function BgVideo() {
  const [i, setI] = useState(0);
  if (i >= SOURCES.length) return null;
  return <video key={SOURCES[i]} className="kbg" src={SOURCES[i]} autoPlay muted loop playsInline aria-hidden="true" onError={() => setI((n) => n + 1)} />;
}
