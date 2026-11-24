"use client";
import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { AI_USE_COLS, DEFAULT_DEPTS, TIPS } from "@/lib/omikuji";
import type { Settings } from "@/lib/useSettings";

/** Staff-only settings: win odds, tips on the back, department list and the survey tally. */
export function StaffPanel({ st, setSt, open = false }: { st: Settings; setSt: Dispatch<SetStateAction<Settings>>; open?: boolean }) {
  const [armed, setArmed] = useState(false);
  const [deptDraft, setDeptDraft] = useState(st.depts.join("\n"));
  const [copyMsg, setCopyMsg] = useState("");
  const [csvShown, setCsvShown] = useState("");

  useEffect(() => setDeptDraft(st.depts.join("\n")), [st.depts]);
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 3000);
    return () => clearTimeout(t);
  }, [armed]);

  const left = Math.max(0, st.mugs - st.won);
  const prob = Math.min(1, left / Math.max(1, st.expected - st.drawn));

  const tally = useMemo(() => {
    const cnt = (d: string | null, a: string | null) => st.log.filter((r) => (d == null || r.dept === d) && (a == null || r.ai === a)).length;
    const rows = [...new Set([...st.depts, ...st.log.map((r) => r.dept), "回答しない"])].filter((d) => cnt(d, null) || st.depts.includes(d));
    const used = cnt(null, "毎日使っている") + cnt(null, "ときどき使う");
    const answered = st.log.length - cnt(null, "未回答");
    return { cnt, rows, used, answered };
  }, [st.log, st.depts]);

  const csv = () =>
    "時刻,部署,AIの利用,運勢,当たり\n" +
    st.log
      .map((r) => [new Date(r.t).toLocaleString("ja-JP"), r.dept, r.ai, r.f, r.win ? "当たり" : ""].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");

  const copyCsv = async () => {
    const t = csv();
    try {
      await navigator.clipboard.writeText(t);
      setCopyMsg(`${st.log.length}件をコピーしました`);
      setCsvShown("");
    } catch {
      setCsvShown(t);
      setCopyMsg("コピーできなかったので、下の欄から選択してコピーしてください");
    }
  };

  const toggleTip = (i: number, on: boolean) =>
    setSt((s) => ({ ...s, tips: (on ? [...new Set([...s.tips, i])] : s.tips.filter((x) => x !== i)).sort((a, b) => a - b) }));

  const content = (
    <>
          <p className="small">当たり確率 ＝ 残りのマグカップ ÷ 残りの想定来場者。1日を通して均等に当たりが出ます。設定はこの端末だけに保存されます。</p>
          <div className="srow">
            <label>
              想定来場者
              <input type="number" min={1} value={st.expected} onChange={(e) => setSt((s) => ({ ...s, expected: Math.max(1, Number(e.target.value) || 1) }))} />
            </label>
            <label>
              マグカップ数
              <input type="number" min={0} max={50} value={st.mugs} onChange={(e) => setSt((s) => ({ ...s, mugs: Math.min(50, Math.max(0, Number(e.target.value) || 0)) }))} />
            </label>
            <button
              className="ghost"
              onClick={() => {
                if (!armed) return setArmed(true);
                setSt((s) => ({ ...s, drawn: 0, won: 0, log: [] }));
                setArmed(false);
              }}
            >
              {armed ? "もう一度押すとリセット" : "カウントと記録をリセット"}
            </button>
            <span className="small">次の1枚の当たり確率：{(prob * 100).toFixed(1)}%</span>
          </div>

          <h3>裏面に載せるAIのコツ</h3>
          <p className="small">チェックしたコツの中から、1枚につき3つを裏面に印刷します。</p>
          <div className="srow">
            <label>
              選び方
              <select value={st.tipMode} onChange={(e) => setSt((s) => ({ ...s, tipMode: e.target.value === "fixed" ? "fixed" : "random" }))}>
                <option value="random">ランダム（毎回ちがう3つ）</option>
                <option value="fixed">固定（チェックした上から3つ）</option>
              </select>
            </label>
            <button className="ghost" type="button" onClick={() => setSt((s) => ({ ...s, tips: TIPS.map((_, i) => i) }))}>
              すべて選ぶ
            </button>
            <button className="ghost" type="button" onClick={() => setSt((s) => ({ ...s, tips: [0, 1, 2] }))}>
              基本の3つだけ
            </button>
            {st.tips.length < 3 ? (
              <span className="warn">あと{3 - st.tips.length}つ選んでください（足りない分は基本のコツを使います）</span>
            ) : (
              <span className="small">{st.tips.length}個から選択</span>
            )}
          </div>
          <ul className="tips">
            {TIPS.map((t, i) => (
              <li key={t}>
                <label>
                  <input type="checkbox" checked={st.tips.includes(i)} onChange={(e) => toggleTip(i, e.target.checked)} />
                  {t}
                </label>
              </li>
            ))}
          </ul>

          <h3>部署リスト</h3>
          <p className="small">1行に1部署。欄の外をタップすると、プルダウンに反映されます（「回答しない」は自動で付きます）。</p>
          <textarea
            rows={8}
            aria-label="部署リスト"
            value={deptDraft}
            onChange={(e) => setDeptDraft(e.target.value)}
            onBlur={() => {
              const list = [...new Set(deptDraft.split("\n").map((s) => s.trim()).filter(Boolean))].slice(0, 40);
              setSt((s) => ({ ...s, depts: list.length ? list : DEFAULT_DEPTS }));
            }}
          />

          <h3>アンケート集計（AIの利用 × 部署）</h3>
          <p className="small">
            {st.log.length
              ? `回答 ${tally.answered}人のうち、業務でAIを使っている（毎日＋ときどき）：${tally.used}人（${tally.answered ? Math.round((tally.used / tally.answered) * 100) : 0}%）`
              : "まだ記録がありません"}
          </p>
          <div className="scroll">
            <table className="tally">
              <tbody>
                <tr>
                  <th>部署</th>
                  {AI_USE_COLS.map((a) => (
                    <th key={a}>{a}</th>
                  ))}
                  <th>計</th>
                </tr>
                {tally.rows.map((d) => (
                  <tr key={d}>
                    <td>{d}</td>
                    {AI_USE_COLS.map((a) => (
                      <td key={a}>{tally.cnt(d, a)}</td>
                    ))}
                    <td>{tally.cnt(d, null)}</td>
                  </tr>
                ))}
                <tr>
                  <td>合計</td>
                  {AI_USE_COLS.map((a) => (
                    <td key={a}>{tally.cnt(null, a)}</td>
                  ))}
                  <td>{st.log.length}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="srow">
            <button className="ghost" type="button" onClick={copyCsv}>
              CSVをコピー
            </button>
            <span className="small">{copyMsg}</span>
          </div>
          {csvShown && <textarea rows={6} readOnly value={csvShown} aria-label="CSV" />}
          <p className="small">記録するのは時刻・部署・AIの利用・運勢・当たりだけです（性別・年齢は記録しません）。</p>
    </>
  );

  if (open) return <section className="staff open">{content}</section>;
  return (
    <section className="band">
      <div className="wrap">
        <details className="staff">
          <summary>スタッフ設定（当たりの出方・裏面のコツ・アンケート）</summary>
          {content}
        </details>
      </div>
    </section>
  );
}
