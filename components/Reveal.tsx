"use client";
import { useEffect, useRef, useState } from "react";
import { FORTUNE_INFO } from "@/lib/omikuji";
import { sfx } from "@/lib/sound";
import { OmikujiTube, Sparkle } from "./Art";
import { FortuneArt } from "./FortuneArt";
import { FortuneName } from "./Slip";

/**
 * The reveal: plays /media/reveal-<slug>.mp4 (your Seedance clip) if it exists,
 * otherwise a built-in animation: tube shakes, stick pops, 3D title lands.
 */
export function Reveal({ fortune, win, onDone }: { fortune: string; win: boolean; onDone: () => void }) {
  const info = FORTUNE_INFO[fortune];
  const [useVideo, setUseVideo] = useState(true);
  const [phase, setPhase] = useState<"shake" | "title">("shake");
  const done = useRef(false);
  const vid = useRef<HTMLVideoElement>(null);
  const finish = () => {
    if (done.current) return;
    done.current = true;
    onDone();
  };

  // Built-in animation timeline (also a safety net if the video stalls).
  useEffect(() => {
    if (useVideo) {
      const t = setTimeout(finish, 9000);
      return () => clearTimeout(t);
    }
    sfx.shake();
    const t1 = setTimeout(() => {
      sfx.pop();
      setPhase("title");
      if (fortune === "大大吉" || win) sfx.fanfare();
      else sfx.chime();
    }, 1000);
    const t2 = setTimeout(finish, 3400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [useVideo]); // eslint-disable-line react-hooks/exhaustive-deps

  if (useVideo) {
    const src = `/media/reveal-${info?.slug}.mp4`;
    return (
      <div className="reveal video">
        <video className="bgvid" src={src} autoPlay muted playsInline aria-hidden="true" />
        <video
          ref={vid}
          className="fgvid"
          src={src}
          playsInline
          onCanPlay={() => {
            const v = vid.current;
            if (!v || !v.paused) return;
            v.play().catch(() => {
              v.muted = true;
              void v.play();
            });
          }}
          onEnded={finish}
          onError={() => setUseVideo(false)}
        />
        {win && <p className="vwin">マグカップ当選！</p>}
        <button className="skip" onClick={finish}>
          スキップ
        </button>
      </div>
    );
  }

  return (
    <div className={`reveal anim ${phase}`} style={{ background: info?.color }}>
      <Sparkle className="rs1" color="#fff" />
      <Sparkle className="rs2" color="#e9525c" />
      <Sparkle className="rs3" color="#fff" />
      <div className="rtube">
        <OmikujiTube />
      </div>
      {phase === "title" && (
        <div className="rtitle">
          <FortuneArt fortune={fortune} className="rart" />
          <div className={`t3d ${info?.slug}`} data-text={fortune}>
            <FortuneName fortune={fortune} />
          </div>
          {win && <p className="rwin">マグカップ当選！</p>}
        </div>
      )}
    </div>
  );
}
