"use client";
import { useEffect, useState } from "react";
import { useSettings } from "@/lib/useSettings";
import { StaffPanel } from "../StaffPanel";

const KEY = "omikuji-staff-ok";

/** Staff screen behind a PIN. */
export function StaffApp() {
  const [ok, setOk] = useState(false);
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");
  const [st, setSt] = useSettings();

  useEffect(() => {
    try {
      if (sessionStorage.getItem(KEY) === "1") setOk(true);
    } catch {
      /* ignore */
    }
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = await fetch("/api/staff", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ pin }) });
    if (r.ok) {
      setOk(true);
      try {
        sessionStorage.setItem(KEY, "1");
      } catch {
        /* ignore */
      }
    } else {
      setErr("PINがちがいます");
      setPin("");
    }
  };

  if (!ok) {
    return (
      <main className="pinpage">
        <form className="pincard" onSubmit={submit}>
          <h1>スタッフ設定</h1>
          <p className="small">PINを入力してください</p>
          <input
            type="password"
            inputMode="numeric"
            autoComplete="off"
            value={pin}
            onChange={(e) => {
              setPin(e.target.value);
              setErr("");
            }}
            aria-label="PIN"
            autoFocus
          />
          {err && <p className="warn">{err}</p>}
          <button className="btn primary big" type="submit">
            ひらく
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="staffpage">
      <div className="wrap">
        <div className="sechd">
          <div>
            <h2>スタッフ設定</h2>
            <p>この端末のキオスク・モニターに、すぐに反映されます。</p>
          </div>
          <div className="cta">
            <a className="btn" href="/kiosk" target="_blank">
              キオスクを開く
            </a>
            <a className="btn" href="/monitor" target="_blank">
              モニターを開く
            </a>
          </div>
        </div>

        <section className="staff open">
          <h3 style={{ marginTop: 8 }}>ブースの動き</h3>
          <div className="srow">
            <label className="toggle">
              <input type="checkbox" checked={st.sound} onChange={(e) => setSt((s) => ({ ...s, sound: e.target.checked }))} />
              効果音を鳴らす
            </label>
            <label className="toggle">
              <input type="checkbox" checked={st.autoPrint} onChange={(e) => setSt((s) => ({ ...s, autoPrint: e.target.checked }))} />
              結果画面で自動印刷する
            </label>
            <label>
              結果画面から戻るまで（秒）
              <input
                type="number"
                min={5}
                max={120}
                value={st.resetSeconds}
                onChange={(e) => setSt((s) => ({ ...s, resetSeconds: Math.min(120, Math.max(5, Number(e.target.value) || 20)) }))}
              />
            </label>
          </div>
          <p className="small">
            自動印刷は Chrome を <code>--kiosk --kiosk-printing</code> で起動すると、印刷ダイアログなしで既定のプリンター（80mmサーマル推奨）に出ます。
          </p>
        </section>

        <StaffPanel st={st} setSt={setSt} open />
      </div>
    </main>
  );
}
