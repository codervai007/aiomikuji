"use client";
import { useState } from "react";

/**
 * Burning title clip for the result screen: the intro plays once, then a seamless loop.
 * Chrome/Edge play the transparent WebM (alpha channel); others get the MP4, whose black the CSS blends away.
 * If a clip can't play, `fallback` (the CSS fire text) is shown instead.
 */
export function TitleVideo({ slug, label, fallback }: { slug: string; label: string; fallback: React.ReactNode }) {
  const [phase, setPhase] = useState<"intro" | "loop">("intro");
  const [failed, setFailed] = useState(false);
  if (failed) return <>{fallback}</>;
  return (
    <div className="titlevid" role="img" aria-label={label}>
      {phase === "intro" ? (
        <video key="intro" autoPlay muted playsInline preload="auto" onEnded={() => setPhase("loop")} onError={() => setFailed(true)}>
          <source src={`/media/title/${slug}-intro.webm`} type="video/webm" />
          <source src={`/media/title/${slug}-intro.mp4`} type="video/mp4" onError={() => setFailed(true)} />
        </video>
      ) : (
        <video key="loop" autoPlay muted loop playsInline preload="auto" onError={() => setFailed(true)}>
          <source src={`/media/title/${slug}-loop.webm`} type="video/webm" />
          <source src={`/media/title/${slug}-loop.mp4`} type="video/mp4" onError={() => setFailed(true)} />
        </video>
      )}
    </div>
  );
}
