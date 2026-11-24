"use client";

export type Step = { s: "idle" | "run" | "done" | "warn"; t: string };

const STEPS = [
  ["来場者", "入力する"],
  ["プログラム", "運勢・当たりを抽選"],
  ["プログラム", "指示文を組み立てる"],
  ["生成AI", "文章を書く"],
  ["プログラム", "確認して印刷"],
];

/** The booth's second screen: shows each step, the prompt and the AI's answer. */
export function Monitor({ steps, prompt, answer, checks, status, online }: { steps: Step[]; prompt: string; answer: string; checks: string; status: string; online: boolean }) {
  return (
    <section className="mon band" id="monitor" aria-labelledby="m">
      <div className="wrap">
        <div className="sechd">
          <div>
            <h2 id="m">裏側モニター</h2>
            <p>おみくじ1枚ができるまでに、AIがどこで・どう動いているか。</p>
          </div>
        </div>
        <div className="window">
          <div className="wbar">
            <i />
            <i />
            <i />
            <span className="url">omikuji / 裏側モニター</span>
            <span className={online ? "mode" : "mode off"}>{status}</span>
          </div>
          <div className="wbody">
            <ol className="flow">
              {STEPS.map(([who, lb], i) => (
                <li key={i} data-s={steps[i].s}>
                  <span className="node">{i + 1}</span>
                  <span>
                    <span className="who">{who}</span>
                    <span className="lb">{lb}</span>
                  </span>
                  <em>{steps[i].t}</em>
                </li>
              ))}
            </ol>
            <div className="pair">
              <div>
                <h4>① プログラムが作る指示文</h4>
                <pre>{prompt || "まだ引かれていません"}</pre>
              </div>
              <div>
                <h4>② 生成AIの答え</h4>
                <pre>{answer || "—"}</pre>
                <p className="checks">{checks}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
