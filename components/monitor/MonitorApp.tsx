"use client";
import { useEffect, useState } from "react";
import { useMonitorFeed } from "@/lib/booth";
import { FORTUNE_INFO } from "@/lib/omikuji";
import { useSettings } from "@/lib/useSettings";
import { Sparkle } from "../Art";
import { BgVideo } from "../BgVideo";
import { LogoImage } from "../Logo";
import { FortuneArt } from "../FortuneArt";

const STEPS = [
  ["来場者", "入力する", "性別・年齢・職種を選び、引き出しを選ぶ"],
  ["プログラム", "運勢・当たりを抽選", "公平さのため、AIではなく乱数で決める"],
  ["プログラム", "指示文を組み立てる", "抽選結果と入力を、指示文に差し込む"],
  ["生成AI", "文章を書く", "指示文を読み、その人向けの文章をその場で作る"],
  ["プログラム", "確認して印刷", "文字数や不適切な表現をチェックする"],
];

/** Big screen for the booth TV: follows the kiosk live. */
export function MonitorApp() {
  const m = useMonitorFeed();
  const [st] = useSettings();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 2000);
    return () => clearInterval(t);
  }, []);

  const stale = m.phase === "idle" || (m.phase === "done" && now - m.at > 45000);
  const used = st.log.filter((r) => r.ai === "毎日使っている" || r.ai === "ときどき使う").length;
  const answered = st.log.filter((r) => r.ai !== "未回答").length;
  const mugsLeft = Math.max(0, st.mugs - st.won);

  return (
    <div className="monitor">
      <BgVideo />
      <header className="mhd">
        <div>
          <p className="pill">IT Connect Fes 2026 ・ IT統括部 アプリケーションサポート</p>
          <h1 className="mtitle">
            <LogoImage height={110} />
            <span>裏側モニター</span>
          </h1>
        </div>
        <div className="mstats">
          <div>
            <span>体験した人</span>
            <b>{st.drawn}</b>
          </div>
          <div>
            <span>当たり残り</span>
            <b>
              {mugsLeft}
              <small>/{st.mugs}</small>
            </b>
          </div>
          <div>
            <span>業務でAIを使う人</span>
            <b>
              {answered ? Math.round((used / answered) * 100) : 0}
              <small>%</small>
            </b>
          </div>
        </div>
      </header>

      <ol className="mflow">
        {STEPS.map(([who, lb, desc], i) => {
          const s = stale ? "idle" : m.steps[i]?.s ?? "idle";
          return (
            <li key={i} data-s={s}>
              <span className="mnode">{i + 1}</span>
              <span className={i === 3 ? "mwho ai" : "mwho"}>{who}</span>
              <b>{lb}</b>
              <em>{stale ? desc : m.steps[i]?.t || desc}</em>
            </li>
          );
        })}
      </ol>

      <div className="mpair">
        <section>
          <h2>① プログラムが作る指示文</h2>
          <pre>{stale ? "次の方をお待ちしています。\nタッチパネルでおみくじを引くと、ここにAIへの指示文が表示されます。" : m.prompt || "…"}</pre>
        </section>
        <section className="manswer">
          <h2>② 生成AIの答え</h2>
          <pre>{stale ? "AIは「次に来そうな言葉」を1つずつ選んで文章を組み立てます。\nだから同じ運勢でも、毎回ちがう文章になります。" : m.answer || "…"}</pre>
          {!stale && m.checks && <p className="mchecks">{m.checks}</p>}
          {!stale && m.fortune && (
            <div className="mresult" style={{ background: FORTUNE_INFO[m.fortune]?.color }}>
              <FortuneArt fortune={m.fortune} className="mart" />
              <b>{m.fortune}</b>
              {m.win && <span className="mwin">当たり！</span>}
            </div>
          )}
        </section>
      </div>

      <footer className="mfoot">
        <Sparkle className="ms1" color="#e9525c" />
        <p>
          <b>ポイント</b>AIに任せるのは「文章づくり」だけ。公平さが必要な抽選や、安全のための確認はプログラムと人が担います。
        </p>
      </footer>
    </div>
  );
}
