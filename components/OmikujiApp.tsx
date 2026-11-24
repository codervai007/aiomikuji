"use client";
import { useEffect, useState } from "react";
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
  rnd,
  templateText,
} from "@/lib/omikuji";
import { useSettings } from "@/lib/useSettings";
import { OmikujiTube, Sparkle } from "./Art";
import { Cabinet } from "./Cabinet";
import { Monitor, type Step } from "./Monitor";
import { Slip, type SlipData } from "./Slip";
import { StaffPanel } from "./StaffPanel";

const IDLE: Step[] = Array.from({ length: 5 }, () => ({ s: "idle", t: "" }));

/** Streams the AI's omikuji text from the API route. Returns "" when AI is unavailable. */
async function generate(input: { fortune: string; age: string; gender: string; dept: string }, onText: (t: string) => void): Promise<string> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20000);
  try {
    const res = await fetch("/api/omikuji", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
      signal: ctrl.signal,
    });
    if (!res.ok || !res.body) return "";
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let text = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      text += dec.decode(value, { stream: true });
      onText(text);
    }
    return text;
  } catch {
    return "";
  } finally {
    clearTimeout(timer);
  }
}

export function OmikujiApp() {
  const [st, setSt] = useSettings();
  const [gender, setGender] = useState<string>("回答しない");
  const [age, setAge] = useState("");
  const [dept, setDept] = useState("");
  const [aiUse, setAiUse] = useState("");
  const [pick, setPick] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [pullTick, setPullTick] = useState(0);

  const [steps, setSteps] = useState<Step[]>(IDLE);
  const [prompt, setPrompt] = useState("");
  const [answer, setAnswer] = useState("");
  const [checks, setChecks] = useState("");
  const [slip, setSlip] = useState<SlipData | null>(null);
  const [side, setSide] = useState<"front" | "back">("front");
  const [aiReady, setAiReady] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/omikuji")
      .then((r) => r.json())
      .then((j) => setAiReady(Boolean(j.ai)))
      .catch(() => setAiReady(false));
  }, []);

  useEffect(() => {
    if (dept && !st.depts.includes(dept)) setDept("");
  }, [st.depts, dept]);

  const left = Math.max(0, st.mugs - st.won);
  const status =
    aiReady == null ? "確認中…" : aiReady ? "生成AI 接続中" : "テンプレート文で動作中";

  const setStep = (i: number, s: Step["s"], t = "") => setSteps((cur) => cur.map((x, j) => (j === i ? { s, t } : x)));

  const draw = async () => {
    if (busy || pick == null) return;
    setBusy(true);
    setPullTick((n) => n + 1);
    setSteps(IDLE);
    setChecks("");
    setAnswer("");

    // 1. input
    setStep(0, "done", `第${kan(pick)}番 ・ ${dept || "部署未回答"}`);

    // 2. draw fortune and win with the random generator (never the AI)
    const fortune = drawFortune();
    const win = left > 0 && rnd() < left / Math.max(1, st.expected - st.drawn);
    setSt((s) => ({
      ...s,
      drawn: s.drawn + 1,
      won: s.won + (win ? 1 : 0),
      log: [...s.log, { t: Date.now(), dept: dept || "回答しない", ai: aiUse || "未回答", f: fortune, win }].slice(-3000),
    }));
    setStep(1, "done", `${fortune}${win ? " ・ 当たり" : ""}`);

    // 3. build the prompt
    const input = { fortune, age, gender, dept };
    const p = buildPrompt(input);
    setPrompt(p);
    setStep(2, "done", "差し込み完了");

    // 4. AI writes (falls back to prepared text)
    setStep(3, "run", "書いています…");
    setSlip(null);
    let text = aiReady ? await generate(input, setAnswer) : "";
    let source = "生成AI";
    if (!text.trim()) {
      text = templateText();
      source = "用意した文章";
    }
    setAnswer(text);
    setStep(3, "done", source);

    // 5. check before printing
    let parsed = parseFortune(text);
    const err = checkFortune(parsed);
    if (err) {
      setChecks(`確認NG（${err}）→ 安全な文章に差し替えて印刷`);
      parsed = parseFortune(templateText());
      setStep(4, "warn", "差し替え");
    } else {
      setChecks("確認OK：3項目そろい・各30字以内・不適切な表現なし");
      setStep(4, "done", "印刷");
    }

    setSlip({ fortune, text: parsed, prompt: p, win, no: pick, tips: chooseTips(st.tips, st.tipMode) });
    setSide("front");
    setBusy(false);
  };

  return (
    <>
      <header className="top">
        <div className="wrap toprow">
          <a className="logo" href="#top">
            <i>籤</i>AIおみくじ
          </a>
          <span className="pill">IT Connect Fes 2026</span>
          <span className="spacer" />
          <div className="counter" aria-live="polite">
            <span>当たりのマグカップ</span>
            <b>{left}</b>
            <small>/ {st.mugs}個</small>
          </div>
        </div>
      </header>

      <section className="band" id="top">
        <div className="wrap">
          <div className="herocard">
            <Sparkle className="sp1" color="#e9525c" />
            <Sparkle className="sp2" color="#86efac" />
            <div>
              <h1>
                AIがその場で書く、
                <br />
                <em>あなただけ</em>のおみくじ
              </h1>
              <p className="lead">
                運勢と当たりはプログラムが公平に抽選。文章は生成AIが一人ひとりに合わせて書きます。裏面には、AIを仕事で使うコツ付き。
              </p>
              <div className="cta">
                <a className="btn primary" href="#draw">
                  おみくじを引く
                </a>
                <a className="btn" href="#monitor">
                  AIのしくみを見る
                </a>
              </div>
              <ul className="chips">
                <li>抽選は乱数で公平</li>
                <li>AIは文章づくりだけ</li>
                <li>個人情報は入力しない</li>
              </ul>
            </div>
            <div className="heroart">
              <Sparkle className="sp3" color="#f5cb32" />
              <OmikujiTube />
              <div className="statcard">
                <b>{st.drawn}</b> 人が体験
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="band" id="draw" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="sechd">
            <div>
              <h2>おみくじを引く</h2>
              <p>3つの質問に答えて、引き出しをひとつ選んでください。</p>
            </div>
          </div>
          <div className="stage">
            <div className="steps">
              <section className="card c1" aria-labelledby="s1">
                <h3 id="s1">
                  <span className="num">一</span>あなたについて
                </h3>
                <div className="fields">
                  <div>
                    <p className="q">性別</p>
                    <div className="seg">
                      {GENDERS.map((g) => (
                        <label key={g}>
                          <input type="radio" name="g" value={g} checked={gender === g} onChange={() => setGender(g)} />
                          <span>{g}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="q">
                      <label htmlFor="age">年齢（任意）</label>
                    </p>
                    <select id="age" value={age} onChange={(e) => setAge(e.target.value)}>
                      <option value="">空欄のまま</option>
                      {AGES.map((a) => (
                        <option key={a}>{a}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <p className="q">
                      <label htmlFor="dept">部署</label>
                    </p>
                    <select id="dept" value={dept} onChange={(e) => setDept(e.target.value)}>
                      <option value="">回答しない</option>
                      {st.depts.map((d) => (
                        <option key={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <p className="note">名前など、個人を特定する情報は入力しません。</p>
              </section>

              <section className="card c2" aria-labelledby="s2">
                <h3 id="s2">
                  <span className="num">二</span>お仕事でAIを使っていますか？
                </h3>
                <div className="seg">
                  {AI_USE.map((a) => (
                    <label key={a}>
                      <input type="radio" name="ai" value={a} checked={aiUse === a} onChange={() => setAiUse(a)} />
                      <span>{a}</span>
                    </label>
                  ))}
                </div>
              </section>

              <section className="card c3" aria-labelledby="s3">
                <h3 id="s3">
                  <span className="num">三</span>引き出しを選ぶ
                </h3>
                <Cabinet pick={pick} onPick={setPick} pullTick={pullTick} />
                <div className="act">
                  <button className="btn primary go" disabled={busy || pick == null} onClick={draw}>
                    おみくじを引く
                  </button>
                  <button className="btn" onClick={() => setPick(1 + Math.floor(rnd() * 100))}>
                    おまかせで選ぶ
                  </button>
                  <span className="pick">
                    {pick == null ? (
                      "引き出しをひとつ選んでください"
                    ) : (
                      <>
                        第<b>{kan(pick)}</b>番
                      </>
                    )}
                  </span>
                </div>
              </section>
            </div>

            <Slip data={slip} side={side} onSide={setSide} printing={busy} />
          </div>
        </div>
      </main>

      <Monitor steps={steps} prompt={prompt} answer={answer} checks={checks} status={status} online={aiReady === true} />
      <StaffPanel st={st} setSt={setSt} />
      <p className="foot-note">IT統括部 アプリケーションサポート ・ 業務でAIを試したいときは気軽にご相談ください</p>
    </>
  );
}
