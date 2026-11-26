"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  FORTUNE_INFO,
  AGES,
  AI_USE,
  GENDERS,
  buildPrompt,
  checkFortune,
  chooseTips,
  drawFortune,
  kan,
  parseFortune,
  pickMatch,
  rnd,
  templateText,
} from "@/lib/omikuji";
import { useSettings } from "@/lib/useSettings";
import { EMPTY_MONITOR, IDLE_STEPS, publishMonitor, type MonitorState, type Step } from "@/lib/booth";
import { aiAvailable, generate } from "@/lib/generate";
import { audioAllowed, setSoundEnabled, sfx, startAmbient, stopAmbient, unlockAudio } from "@/lib/sound";
import { OmikujiTube, Sparkle } from "../Art";
import { BgVideo } from "../BgVideo";
import { LogoImage } from "../Logo";
import { Cabinet } from "../Cabinet";
import { Reveal } from "../Reveal";
import TiltedCard from "../TiltedCard";
import { FortuneName, PrintSlip, SlipBack, SlipFront, useGuideQr, type SlipData } from "../Slip";
import { FORTUNE_EN, tr, type Lang } from "@/lib/i18n";
import { LangProvider, LangToggle } from "@/lib/useLang";
import { Scatter } from "../Scatter";
import { TitleVideo } from "../TitleVideo";

type Screen = "idle" | "about" | "ai" | "pick" | "reveal" | "result";

export function KioskApp() {
  const [st, setSt] = useSettings();
  const [screen, setScreen] = useState<Screen>("idle");
  const [gender, setGender] = useState("回答しない");
  const [age, setAge] = useState("");
  const [dept, setDept] = useState("");
  const [aiUse, setAiUse] = useState("");
  const [pick, setPick] = useState<number | null>(null);
  const [pullTick, setPullTick] = useState(0);
  const [draw, setDraw] = useState<{ fortune: string; win: boolean } | null>(null);
  const [slip, setSlip] = useState<SlipData | null>(null);
  const [revealDone, setRevealDone] = useState(false);
  const [showBack, setShowBack] = useState(false);
  const [aiReady, setAiReady] = useState(false);
  const [idleVideo, setIdleVideo] = useState(true);
  const [idleReady, setIdleReady] = useState(false);
  // Start screen: play the intro (AI → おみくじ) once, then loop its ending and show START.
  const [idlePhase, setIdlePhase] = useState<"intro" | "loop">("intro");
  const [soundBlocked, setSoundBlocked] = useState(false);
  const [lang, setLang] = useState<Lang>("ja");
  const t = (ja: string) => tr(lang, ja);
  const en = lang === "en";
  const qr = useGuideQr();
  const mon = useRef<MonitorState>(EMPTY_MONITOR);

  useEffect(() => {
    aiAvailable().then(setAiReady);
  }, []);
  useEffect(() => setSoundEnabled(st.sound), [st.sound]);

  const pushMon = useCallback((patch: Partial<MonitorState>) => {
    mon.current = { ...mon.current, ...patch, at: Date.now() };
    publishMonitor(mon.current);
  }, []);
  const setStep = useCallback(
    (i: number, s: Step["s"], t = "") => pushMon({ steps: mon.current.steps.map((x, j) => (j === i ? { s, t } : x)) }),
    [pushMon],
  );

  const reset = useCallback(() => {
    setScreen("idle");
    setLang("ja");
    setGender("回答しない");
    setAge("");
    setDept("");
    setAiUse("");
    setPick(null);
    setDraw(null);
    setSlip(null);
    setRevealDone(false);
    setShowBack(false);
  }, []);

  // Each time the start screen comes back, play the intro again; replay it every 45 s while idle.
  useEffect(() => {
    if (screen === "idle") setIdlePhase("intro");
  }, [screen]);
  useEffect(() => {
    if (screen !== "idle") return;
    const t = setTimeout(() => setIdlePhase(idlePhase === "intro" ? "loop" : "intro"), idlePhase === "intro" ? 12000 : 45000);
    return () => clearTimeout(t);
  }, [screen, idlePhase]);

  // Intro sound: unmute once it plays. Browsers block sound until someone has tapped the page
  // (unless Chrome runs with --autoplay-policy=no-user-gesture-required); then it pauses the
  // video, so go back to muted and show the 🔊 button.
  useEffect(() => {
    if (screen !== "idle" || idlePhase !== "intro" || !st.sound) return;
    const v = document.querySelector<HTMLVideoElement>(".idlevid");
    if (!v) return;
    let t: ReturnType<typeof setTimeout>;
    const tryUnmute = () => {
      if (!v.muted) return;
      v.muted = false;
      t = setTimeout(() => {
        if (v.paused && !v.ended) {
          v.muted = true;
          void v.play().catch(() => {});
          setSoundBlocked(true);
        } else setSoundBlocked(false);
      }, 150);
    };
    if (!v.paused) tryUnmute();
    else v.addEventListener("playing", tryUnmute, { once: true });
    return () => {
      clearTimeout(t);
      v.removeEventListener("playing", tryUnmute);
    };
  }, [screen, idlePhase, st.sound]);

  // Fire sound under the looping START video.
  useEffect(() => {
    if (screen === "idle" && idlePhase === "loop" && idleVideo && st.sound && !soundBlocked) void startAmbient("/media/idle-ambient.wav");
    else stopAmbient();
  }, [screen, idlePhase, idleVideo, st.sound, soundBlocked]);
  useEffect(() => () => stopAmbient(), []);
  useEffect(() => {
    if (st.sound && !audioAllowed()) setSoundBlocked(true);
  }, [st.sound]);

  // No sound button: the first touch anywhere unlocks sound for the rest of the session.
  useEffect(() => {
    if (!soundBlocked) return;
    const onTouch = () => {
      unlockAudio();
      setSoundBlocked(false);
    };
    window.addEventListener("pointerdown", onTouch, { once: true });
    return () => window.removeEventListener("pointerdown", onTouch);
  }, [soundBlocked]);


  // A video that failed before the page finished loading never fires onError; check it directly.
  useEffect(() => {
    if (screen !== "idle") return;
    const t = setTimeout(() => {
      const v = document.querySelector<HTMLVideoElement>(".idlevid");
      if (v?.error) setIdleVideo(false);
    }, 1500);
    return () => clearTimeout(t);
  }, [screen, idlePhase]);

  // No automatic return to the start screen: pages stay until someone moves on.

  // Result screen: print. It stays until the visitor or staff presses 終わる (no countdown).
  useEffect(() => {
    if (screen !== "result" || !st.autoPrint) return;
    const t = setTimeout(() => window.print(), 700);
    return () => clearTimeout(t);
  }, [screen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Move to the result once both the reveal and the AI text are finished.
  useEffect(() => {
    if (screen === "reveal" && revealDone && slip) {
      setScreen("result");
    }
  }, [screen, revealDone, slip]);

  const go = (s: Screen) => {
    sfx.tap();
    setScreen(s);
  };

  const start = () => {
    unlockAudio();
    sfx.tap();
    pushMon({ ...EMPTY_MONITOR, phase: "input", steps: IDLE_STEPS.map((x, i) => (i === 0 ? { s: "run", t: "入力中…" } : x)) });
    setScreen("about");
  };

  const runDraw = async () => {
    if (pick == null) return;
    unlockAudio();
    setPullTick((n) => n + 1);
    const no = pick;

    // Fortune and win come from the random generator, never from the AI.
    const fortune = drawFortune();
    const mugsLeft = Math.max(0, st.mugs - st.won);
    const win = mugsLeft > 0 && rnd() < mugsLeft / Math.max(1, st.expected - st.drawn);
    setSt((s) => ({
      ...s,
      drawn: s.drawn + 1,
      won: s.won + (win ? 1 : 0),
      log: [...s.log, { t: Date.now(), dept: dept || "回答しない", ai: aiUse || "未回答", f: fortune, win }].slice(-3000),
    }));
    setDraw({ fortune, win });
    setRevealDone(false);
    setSlip(null);
    setScreen("reveal");

    const match = pickMatch(st.depts, dept);
    const input = { fortune, age, gender, dept, match, lang };
    const prompt = buildPrompt(input);
    pushMon({ phase: "drawing", steps: IDLE_STEPS, prompt: "", answer: "", checks: "", fortune, win, no });
    setStep(0, "done", `第${kan(no)}番 ・ ${dept || "職種未回答"}`);
    setStep(1, "done", `${fortune}${win ? " ・ 当たり" : ""}${match ? ` ・ 適職：${match}` : ""}`);
    pushMon({ prompt });
    setStep(2, "done", "差し込み完了");
    setStep(3, "run", "書いています…");

    let text = aiReady ? await generate(input, (t) => pushMon({ answer: t })) : "";
    let source = "生成AI";
    if (!text.trim()) {
      text = templateText(dept, match, lang);
      source = "用意した文章";
    }
    pushMon({ answer: text });
    setStep(3, "done", source);

    let parsed = parseFortune(text, lang);
    const err = checkFortune(parsed, match, lang);
    if (err) {
      parsed = parseFortune(templateText(dept, match, lang), lang);
      pushMon({ checks: `確認NG（${err}）→ 安全な文章に差し替えて印刷` });
      setStep(4, "warn", "差し替え");
    } else {
      pushMon({ checks: "確認OK：全項目そろい・文字数OK・不適切な表現なし" });
      setStep(4, "done", "印刷");
    }
    pushMon({ phase: "done" });
    setSlip({ fortune, text: parsed, prompt, win, no, tips: chooseTips(st.tips, st.tipMode) });
  };

  const mugsLeft = Math.max(0, st.mugs - st.won);

  return (
    <LangProvider value={lang}>
    <div className="kiosk" data-screen={screen} lang={lang}>
      {screen !== "idle" && screen !== "reveal" && <BgVideo />}
      {screen !== "idle" && screen !== "reveal" && (
        <header className="kbar">
          <a href="/" className="logolink" aria-label="ホームへ戻る">
            <LogoImage height={64} />
          </a>
          <LangToggle lang={lang} onChange={(l) => (sfx.tap(), setLang(l))} />
          <span className="counter">
            <span>{t("当たり残り")}</span>
            <b>{mugsLeft}</b>
            <small>/ {st.mugs}</small>
          </span>
        </header>
      )}

      {screen === "idle" && (
        <button className={idleVideo ? "idle hasvid" : "idle"} onClick={start} aria-label={t("タッチしてスタート")}>
          {idleVideo &&
            (idlePhase === "intro" ? (
              <video
                key="intro"
                className="idlevid"
                src="/media/intro.mp4"
                poster="/media/intro-poster.jpg"
                preload="auto"
                autoPlay
                muted
                playsInline
                onLoadedData={() => setIdleReady(true)}
                onEnded={() => setIdlePhase("loop")}
                onError={() => setIdlePhase("loop")}
              />
            ) : (
              <video
                key="loop"
                className="idlevid"
                src="/media/idle.mp4"
                poster="/media/idle-poster.jpg"
                autoPlay
                muted
                loop
                playsInline
                onLoadedData={() => setIdleReady(true)}
                onError={() => setIdleVideo(false)}
              />
            ))}
          <Sparkle className="is1" color="#e9525c" />
          <Sparkle className="is2" color="#86efac" />
          <Sparkle className="is3" color="#f5cb32" />
          <div className="idlecard">
            <p className="pill">{t("IT Connect Fes 2026 ・ IT統括部")}</p>
            {en ? (
              <h1>
                A fortune written by AI,
                <br />
                <em>just for you</em>
              </h1>
            ) : (
              <h1>
                AIが書く、
                <br />
                <em>あなただけ</em>のおみくじ
              </h1>
            )}
            <span className={idlePhase === "loop" ? "btn primary startbtn show" : "btn primary startbtn"}>{idleVideo ? "START" : t("タッチしてスタート")}</span>
            <p className="idlemug">
              {en ? (
                <>
                  Prize mugs <b>{mugsLeft} left</b> / {st.mugs}
                </>
              ) : (
                <>
                  当たりのマグカップ <b>残り {mugsLeft}</b> / {st.mugs}個
                </>
              )}
            </p>
          </div>
          {!idleVideo && (
            <div className="idletube">
              <OmikujiTube />
            </div>
          )}
        </button>
      )}
      {screen === "idle" && <LangToggle className="idlelang" lang={lang} onChange={(l) => (unlockAudio(), sfx.tap(), setLang(l))} />}

      {screen === "about" && (
        <main className="kpage">
          <div className="khd">
            <h2>
              <Scatter text={t("あなたについて")} gradient />
            </h2>
            <p>
              <Scatter text={t("わかる範囲でOKです。名前は入力しません。")} delay={0.1} />
            </p>
          </div>
          <div className="kcard">
            <Row scatter={0.15} label={t("性別")} t={t} items={[...GENDERS]} value={gender} onPick={setGender} />
            <Row scatter={0.25} label={t("年齢（任意）")} t={t} items={["答えない", ...AGES]} value={age || "答えない"} onPick={(v) => setAge(v === "答えない" ? "" : v)} />
            <Row scatter={0.35} label={t("職種")} t={t} items={["回答しない", ...st.depts]} value={dept || "回答しない"} onPick={(v) => setDept(v === "回答しない" ? "" : v)} />
          </div>
          <nav className="knav">
            <button className="btn big" onClick={() => go("idle")}>
              {t("← もどる")}
            </button>
            <button className="btn big primary" onClick={() => go("ai")}>
              {t("次へ →")}
            </button>
          </nav>
        </main>
      )}

      {screen === "ai" && (
        <main className="kpage">
          <div className="khd">
            <h2>{t("お仕事でAIを使っていますか？")}</h2>
            <p>{t("タップすると次へすすみます。")}</p>
          </div>
          <div className="aitiles">
            {AI_USE.map((a, i) => (
              <button
                key={a}
                className={aiUse === a ? "aitile on" : "aitile"}
                style={{ ["--c" as string]: ["#0bbf5c", "#1d86cf", "#f08a1c", "#de1f78"][i] }}
                onClick={() => {
                  sfx.tap();
                  setAiUse(a);
                  setTimeout(() => setScreen("pick"), 250);
                }}
              >
                <span className="aimark">{(en ? ["E", "S", "T", "N"] : ["毎", "時", "試", "初"])[i]}</span>
                {t(a)}
              </button>
            ))}
          </div>
          <nav className="knav">
            <button className="btn big" onClick={() => go("about")}>
              {t("← もどる")}
            </button>
            <button className="btn big" onClick={() => go("pick")}>
              {t("答えずに次へ →")}
            </button>
          </nav>
        </main>
      )}

      {screen === "pick" && (
        <main className="kpage pickpage">
          <div className="pickcab">
            <Cabinet
              pick={pick}
              onPick={(n) => {
                sfx.tap();
                setPick(n);
              }}
              pullTick={pullTick}
            />
          </div>
          <aside className="pickside">
            <h2>
              {en ? (
                "Choose one drawer"
              ) : (
                <>
                  <span className="nb">引き出しを</span>
                  <span className="nb">ひとつ選んでください</span>
                </>
              )}
            </h2>
            <div className="picked">
              {pick == null ? (
                <span className="none">{t("まだ選んでいません")}</span>
              ) : en ? (
                <>
                  No. <b>{pick}</b>
                </>
              ) : (
                <>
                  第<b>{kan(pick)}</b>番
                </>
              )}
            </div>
            <button className="btn big" onClick={() => (sfx.tap(), setPick(1 + Math.floor(rnd() * 100)))}>
              {t("おまかせで選ぶ")}
            </button>
            <button className="btn big primary drawbtn" disabled={pick == null} onClick={runDraw}>
              {t("引く！")}
            </button>
            <button className="linkbtn" onClick={() => go("ai")}>
              {t("← もどる")}
            </button>
          </aside>
        </main>
      )}

      {screen === "reveal" && draw && <Reveal fortune={draw.fortune} win={draw.win} onDone={() => setRevealDone(true)} />}
      {screen === "reveal" && revealDone && !slip && <div className="waiting">{t("おみくじを作っています…")}</div>}

      {screen === "result" && slip && (
        <main className="kpage resultpage">
          {slip.win && <Confetti />}
          <div className="resslip">
            <TiltedCard
              containerWidth="100%"
              containerHeight="auto"
              imageWidth="100%"
              imageHeight="auto"
              rotateAmplitude={10}
              scaleOnHover={1.03}
              glare={0.35}
              shadow={0.55}
              flipped={showBack}
              onFlip={(f) => {
                sfx.tap();
                setShowBack(f);
              }}
              backContent={<SlipBack data={slip} qr={qr} />}
            >
              <SlipFront data={slip} />
            </TiltedCard>
            <p className="fliphint">{t("タップで裏返す")}</p>
          </div>
          <aside className="resside">
            <p className="reslabel">{t("あなたの運勢は")}</p>
            <p className="resreading">{en ? FORTUNE_EN[slip.fortune]?.romaji : FORTUNE_INFO[slip.fortune]?.reading}</p>
            <TitleVideo
              key={slip.no + slip.fortune}
              slug={FORTUNE_INFO[slip.fortune]?.slug ?? "chukichi"}
              label={slip.fortune}
              fallback={
                <p className={`resluck t3d ${FORTUNE_INFO[slip.fortune]?.slug ?? ""}`}>
                  <FortuneName fortune={slip.fortune} />
                </p>
              }
            />
            {en && <p className="resen">{FORTUNE_EN[slip.fortune]?.name}</p>}
            {slip.win ? (
              <div className="reswin">
                <b>{t("マグカップ当選！")}</b>
                {t("スタッフにお声がけください")}
              </div>
            ) : (
              <p className="resmsg">{t("裏面の「AIを仕事で使うコツ」もぜひ読んでみてください。")}</p>
            )}
            <p className="resprint">{t(st.autoPrint ? "印刷しています。プリンターからお受け取りください。" : "スタッフが印刷してお渡しします。")}</p>
            <div className="resbtns">
              <button className="btn big" onClick={() => (sfx.tap(), setShowBack((b) => !b))}>
                {t(showBack ? "表を見る" : "裏（AIミニ解説）を見る")}
              </button>
              <button className="btn big primary" onClick={() => (sfx.tap(), reset())}>
                {t("終わる")}
              </button>
            </div>
            <a className="linkbtn homelink" href="/" onClick={() => sfx.tap()}>
              <span aria-hidden>⌂</span> <b>{t("ホームへ戻る")}</b>
            </a>
          </aside>
        </main>
      )}

      <PrintSlip data={slip} qr={qr} />
    </div>
    </LangProvider>
  );
}

function Row({
  label,
  items,
  value,
  onPick,
  t,
  scatter,
}: {
  label: string;
  items: string[];
  value: string;
  onPick: (v: string) => void;
  t: (s: string) => string;
  /** When set, letters fly into place starting after this many seconds. */
  scatter?: number;
}) {
  const sc = (text: string) => (scatter === undefined ? text : <Scatter text={text} delay={scatter} />);
  return (
    <div className="krow">
      <p className="q">{sc(label)}</p>
      <div className="kchips">
        {items.map((it) => (
          <button
            key={it}
            className={value === it ? "kchip on" : "kchip"}
            aria-pressed={value === it}
            onClick={() => {
              sfx.tap();
              onPick(it);
            }}
          >
            {sc(t(it))}
          </button>
        ))}
      </div>
    </div>
  );
}

const CONFETTI_COLORS = ["#e9525c", "#f5cb32", "#1d86cf", "#0bbf5c", "#de1f78", "#f6c68b"];
function Confetti() {
  const [pieces] = useState(() =>
    Array.from({ length: 36 }, (_, i) => ({
      left: Math.round(rnd() * 100),
      delay: (rnd() * 1.2).toFixed(2),
      dur: (2.4 + rnd() * 1.6).toFixed(2),
      rot: Math.round(rnd() * 360),
      c: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    })),
  );
  return (
    <div className="confetti" aria-hidden="true">
      {pieces.map((p, i) => (
        <i key={i} style={{ left: `${p.left}%`, animationDelay: `${p.delay}s`, animationDuration: `${p.dur}s`, background: p.c, transform: `rotate(${p.rot}deg)` }} />
      ))}
    </div>
  );
}
