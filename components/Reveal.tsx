"use client";
import { useEffect, useRef, useState } from "react";
import { FORTUNE_INFO, rnd } from "@/lib/omikuji";
import { sfx } from "@/lib/sound";
import { Sparkle } from "./Art";
import { FortuneArt } from "./FortuneArt";
import { FortuneName } from "./Slip";

/** "Moment of fate" clips; one plays at random before every reveal (a missing file is skipped). */
const DRAW_CLIPS = ["/media/draw-1.mp4", "/media/draw-2.mp4"];

/**
 * The reveal, in two stages:
 *  1. draw   — a random /media/draw-*.mp4 (box shakes, stick flies, white flash)
 *  2. reveal — /media/reveal-<slug>.mp4 for the fortune, or a built-in title animation
 * Each stage falls back gracefully when its video is missing or can't play.
 */
export function Reveal({ fortune, win, onDone }: { fortune: string; win: boolean; onDone: () => void }) {
  const info = FORTUNE_INFO[fortune];
  const [drawSrc] = useState(() => DRAW_CLIPS[Math.floor(rnd() * DRAW_CLIPS.length)]);
  const [stage, setStage] = useState<"draw" | "reveal">("draw");
  const [revealVideo, setRevealVideo] = useState(true);
  const [showTitle, setShowTitle] = useState(false);
  const [flash, setFlash] = useState(false);
  const done = useRef(false);
  const vid = useRef<HTMLVideoElement>(null);

  const finish = () => {
    if (done.current) return;
    done.current = true;
    onDone();
  };
  const toReveal = () => {
    if (stage !== "draw") return;
    setFlash(true);
    setStage("reveal");
    setTimeout(() => setFlash(false), 700);
  };

  // Safety net per stage, in case a video stalls.
  useEffect(() => {
    const t = setTimeout(stage === "draw" ? toReveal : finish, 9000);
    return () => clearTimeout(t);
  }, [stage]); // eslint-disable-line react-hooks/exhaustive-deps

  // Built-in title animation, used when the fortune has no reveal video.
  useEffect(() => {
    if (stage !== "reveal" || revealVideo) return;
    const t1 = setTimeout(() => {
      sfx.pop();
      setShowTitle(true);
      if (fortune === "大大吉" || win) sfx.fanfare();
      else sfx.chime();
    }, 200);
    const t2 = setTimeout(finish, 2800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [stage, revealVideo]); // eslint-disable-line react-hooks/exhaustive-deps

  const play = () => {
    const v = vid.current;
    if (!v || !v.paused) return;
    v.play().catch(() => {
      v.muted = true;
      void v.play();
    });
  };

  const skip = (
    <button className="skip" onClick={finish}>
      スキップ
    </button>
  );
  const flashEl = flash && <div className="wflash" aria-hidden="true" />;

  if (stage === "draw") {
    return (
      <div className="reveal video">
        <video key="draw" ref={vid} className="fullvid" src={drawSrc} playsInline onCanPlay={play} onEnded={toReveal} onError={toReveal} />
        {skip}
      </div>
    );
  }

  if (revealVideo) {
    const src = `/media/reveal-${info?.slug}.mp4`;
    return (
      <div className="reveal video">
        <video key="bg" className="bgvid" src={src} autoPlay muted playsInline aria-hidden="true" />
        <video key="reveal" ref={vid} className="fgvid" src={src} playsInline onCanPlay={play} onEnded={finish} onError={() => setRevealVideo(false)} />
        {win && <p className="vwin">マグカップ当選！</p>}
        {skip}
        {flashEl}
      </div>
    );
  }

  return (
    <div className="reveal anim title" style={{ background: info?.color }}>
      <Sparkle className="rs1" color="#fff" />
      <Sparkle className="rs2" color="#e9525c" />
      <Sparkle className="rs3" color="#fff" />
      {showTitle && (
        <div className="rtitle">
          <FortuneArt fortune={fortune} className="rart" />
          <div className={`t3d ${info?.slug}`}>
            <FortuneName fortune={fortune} />
          </div>
          {win && <p className="rwin">マグカップ当選！</p>}
        </div>
      )}
      {flashEl}
    </div>
  );
}
