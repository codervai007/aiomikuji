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
export function Monitor({ steps, prompt, answer, checks, status }: { steps: Step[]; prompt: string; answer: string; checks: string; status: string }) {
  return (
    <section className="mon band" aria-labelledby="m">
      <div className="wrap">
        <div className="monhd">
          <h2 id="m">裏側モニター</h2>
          <p className="mode">{status}</p>
        </div>
        <ol className="flow">
          {STEPS.map(([who, lb], i) => (
            <li key={i} data-s={steps[i].s}>
              <span className="node">{i + 1}</span>
              <span className="who">{who}</span>
              <span className="lb">{lb}</span>
              <em>{steps[i].t}</em>
            </li>
          ))}
        </ol>
        <div className="pair">
          <div>
            <h3>① プログラムが作る指示文</h3>
            <pre>{prompt || "まだ引かれていません"}</pre>
          </div>
          <div>
            <h3>② 生成AIの答え</h3>
            <pre>{answer || "—"}</pre>
            <p className="checks">{checks}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
