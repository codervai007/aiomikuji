"use client";
import { useState } from "react";

/**
 * Burning title clip for the result screen: the intro plays once, then a seamless loop.
 * The clips have a black background, which the CSS blends away (mix-blend-mode: screen).
 * If a clip can't play, `fallback` (the CSS fire text) is shown instead.
 */
export function TitleVideo({ slug, label, fallback }: { slug: string; label: string; fallback: React.ReactNode }) {
  const [phase, setPhase] = useState<"intro" | "loop">("intro");
  const [failed, setFailed] = useState(false);
  if (failed) return <>{fallback}</>;
  return (
    <div className="titlevid" role="img" aria-label={label}>
      {phase === "intro" ? (
        <video key="intro" src={`/media/title/${slug}-intro.mp4`} autoPlay muted playsInline preload="auto" onEnded={() => setPhase("loop")} onError={() => setFailed(true)} />
      ) : (
        <video key="loop" src={`/media/title/${slug}-loop.mp4`} autoPlay muted loop playsInline preload="auto" onError={() => setFailed(true)} />
      )}
      {/* load the loop early so the switch is instant */}
      {phase === "intro" && <link rel="preload" as="video" href={`/media/title/${slug}-loop.mp4`} />}
    </div>
  );
}
