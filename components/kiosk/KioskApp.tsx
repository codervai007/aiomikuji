"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
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
import { setSoundEnabled, sfx, unlockAudio } from "@/lib/sound";
import { OmikujiTube, Sparkle } from "../Art";
import { Cabinet } from "../Cabinet";
import { Reveal } from "../Reveal";
import { FortuneName, PrintSlip, SlipBack, SlipFront, useGuideQr, type SlipData } from "../Slip";

type Screen = "idle" | "about" | "ai" | "pick" | "reveal" | "result";
const PROGRESS: Screen[] = ["about", "ai", "pick", "result"];
const IDLE_TIMEOUT_MS = 60000;

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
  const [left, setLeftSec] = useState(0);
  const [aiReady, setAiReady] = useState(false);
  const [idleVideo, setIdleVideo] = useState(true);
  const [idleReady, setIdleReady] = useState(false);
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

  // Back to the start screen after a minute without a touch.
  useEffect(() => {
    if (screen === "idle" || screen === "reveal" || screen === "result") return;
    let t = setTimeout(reset, IDLE_TIMEOUT_MS);
    const bump = () => {
      clearTimeout(t);
      t = setTimeout(reset, IDLE_TIMEOUT_MS);
    };
    window.addEventListener("pointerdown", bump);
    return () => {
      clearTimeout(t);
      window.removeEventListener("pointerdown", bump);
    };
  }, [screen, reset]);

  // Result screen: print, then count down and reset.
  useEffect(() => {
    if (screen !== "result") return;
    if (st.autoPrint) setTimeout(() => window.print(), 700);
    const iv = setInterval(() => setLeftSec((n) => n - 1), 1000);
    return () => clearInterval(iv);
  }, [screen]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (screen === "result" && left <= 0) reset();
  }, [left, screen, reset]);

  // Move to the result once both the reveal and the AI text are finished.
  useEffect(() => {
    if (screen === "reveal" && revealDone && slip) {
      setLeftSec(st.resetSeconds);
      setScreen("result");
    }
  }, [screen, revealDone, slip, st.resetSeconds]);

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
    const input = { fortune, age, gender, dept, match };
    const prompt = buildPrompt(input);
    pushMon({ phase: "drawing", steps: IDLE_STEPS, prompt: "", answer: "", checks: "", fortune, win, no });
    setStep(0, "done", `第${kan(no)}番 ・ ${dept || "部署未回答"}`);
    setStep(1, "done", `${fortune}${win ? " ・ 当たり" : ""}${match ? ` ・ 適職：${match}` : ""}`);
    pushMon({ prompt });
    setStep(2, "done", "差し込み完了");
    setStep(3, "run", "書いています…");

    let text = aiReady ? await generate(input, (t) => pushMon({ answer: t })) : "";
    let source = "生成AI";
    if (!text.trim()) {
      text = templateText(dept, match);
      source = "用意した文章";
    }
    pushMon({ answer: text });
    setStep(3, "done", source);

    let parsed = parseFortune(text);
    const err = checkFortune(parsed, match);
    if (err) {
      parsed = parseFortune(templateText(dept, match));
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
  const stepIdx = PROGRESS.indexOf(screen);

  return (
    <div className="kiosk" data-screen={screen}>
      {screen !== "idle" && screen !== "reveal" && (
        <header className="kbar">
          <span className="logo">
            <i>籤</i>AIおみくじ
          </span>
          <ol className="dots" aria-label="すすみ具合">
            {PROGRESS.map((p, i) => (
              <li key={p} data-on={i <= stepIdx}>
                {["あなた", "AI", "引き出し", "結果"][i]}
              </li>
            ))}
          </ol>
          <span className="counter">
            <span>当たり残り</span>
            <b>{mugsLeft}</b>
            <small>/ {st.mugs}</small>
          </span>
        </header>
      )}

      {screen === "idle" && (
        <button className={idleVideo && idleReady ? "idle hasvid" : "idle"} onClick={start} aria-label="タッチしてスタート">
          {idleVideo && <video className="idlevid" src="/media/idle.mp4" autoPlay muted loop playsInline onLoadedData={() => setIdleReady(true)} onError={() => setIdleVideo(false)} />}
          <Sparkle className="is1" color="#e9525c" />
          <Sparkle className="is2" color="#86efac" />
          <Sparkle className="is3" color="#f5cb32" />
          <div className="idlecard">
            <p className="pill">IT Connect Fes 2026 ・ IT統括部</p>
            <h1>
              AIが書く、
              <br />
              <em>あなただけ</em>のおみくじ
            </h1>
            <span className="btn primary startbtn">{idleVideo && idleReady ? "START" : "タッチしてスタート"}</span>
            <p className="idlemug">
              当たりのマグカップ <b>残り {mugsLeft}</b> / {st.mugs}個
            </p>
          </div>
          {!idleVideo && (
            <div className="idletube">
              <OmikujiTube />
            </div>
          )}
        </button>
      )}

      {screen === "about" && (
        <main className="kpage">
          <div className="khd">
            <h2>あなたについて</h2>
            <p>わかる範囲でOKです。名前は入力しません。</p>
          </div>
          <div className="kcard">
            <Row label="性別" items={[...GENDERS]} value={gender} onPick={setGender} />
            <Row label="年齢（任意）" items={["答えない", ...AGES]} value={age || "答えない"} onPick={(v) => setAge(v === "答えない" ? "" : v)} />
            <Row label="部署" items={["回答しない", ...st.depts]} value={dept || "回答しない"} onPick={(v) => setDept(v === "回答しない" ? "" : v)} />
          </div>
          <nav className="knav">
            <button className="btn big" onClick={() => go("idle")}>
              ← もどる
            </button>
            <button className="btn big primary" onClick={() => go("ai")}>
              次へ →
            </button>
          </nav>
        </main>
      )}

      {screen === "ai" && (
        <main className="kpage">
          <div className="khd">
            <h2>お仕事でAIを使っていますか？</h2>
            <p>タップすると次へすすみます。</p>
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
                <span className="aimark">{["毎", "時", "試", "初"][i]}</span>
                {a}
              </button>
            ))}
          </div>
          <nav className="knav">
            <button className="btn big" onClick={() => go("about")}>
              ← もどる
            </button>
            <button className="btn big" onClick={() => go("pick")}>
              答えずに次へ →
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
            <h2>引き出しをひとつ選んでください</h2>
            <div className="picked">
              {pick == null ? (
                <span className="none">まだ選んでいません</span>
              ) : (
                <>
                  第<b>{kan(pick)}</b>番
                </>
              )}
            </div>
            <button className="btn big" onClick={() => (sfx.tap(), setPick(1 + Math.floor(rnd() * 100)))}>
              おまかせで選ぶ
            </button>
            <button className="btn big primary drawbtn" disabled={pick == null} onClick={runDraw}>
              引く！
            </button>
            <button className="linkbtn" onClick={() => go("ai")}>
              ← もどる
            </button>
          </aside>
        </main>
      )}

      {screen === "reveal" && draw && <Reveal fortune={draw.fortune} win={draw.win} onDone={() => setRevealDone(true)} />}
      {screen === "reveal" && revealDone && !slip && <div className="waiting">AIがおみくじを書いています…</div>}

      {screen === "result" && slip && (
        <main className="kpage resultpage">
          {slip.win && <Confetti />}
          <div className="resslip">{showBack ? <SlipBack data={slip} qr={qr} /> : <SlipFront data={slip} />}</div>
          <aside className="resside">
            <p className="reslabel">あなたの運勢は</p>
            <p className={`resluck t3d ${slip.fortune === "大大吉" ? "daidaikichi" : slip.fortune === "大吉" ? "daikichi" : "chukichi"}`}>
              <FortuneName fortune={slip.fortune} />
            </p>
            {slip.win ? (
              <div className="reswin">
                <b>マグカップ当選！</b>
                スタッフにお声がけください
              </div>
            ) : (
              <p className="resmsg">裏面の「AIを仕事で使うコツ」もぜひ読んでみてください。</p>
            )}
            <p className="resprint">{st.autoPrint ? "印刷しています。プリンターからお受け取りください。" : "スタッフが印刷してお渡しします。"}</p>
            <div className="resbtns">
              <button className="btn big" onClick={() => (sfx.tap(), setShowBack((b) => !b))}>
                {showBack ? "表を見る" : "裏（AIミニ解説）を見る"}
              </button>
              <button className="btn big primary" onClick={() => (sfx.tap(), reset())}>
                おわる
              </button>
            </div>
            <p className="rescount">あと {Math.max(0, left)} 秒で最初の画面にもどります</p>
          </aside>
        </main>
      )}

      <PrintSlip data={slip} qr={qr} />
    </div>
  );
}

function Row({ label, items, value, onPick }: { label: string; items: string[]; value: string; onPick: (v: string) => void }) {
  return (
    <div className="krow">
      <p className="q">{label}</p>
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
            {it}
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
