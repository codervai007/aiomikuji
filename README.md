# AIおみくじ（AI Omikuji Booth）

IT Connect Fes 2026 のブース体験「AIおみくじ」。Next.js（App Router）で作り、Vercel にそのままデプロイできます。

## しくみ

1. 来場者が性別・年齢（任意）・部署・AIの利用状況を選び、100個の引き出しから1つ選ぶ
2. 運勢と当たり（マグカップ）は **プログラムの乱数** で抽選（AIは抽選しない）
3. サーバー（`/api/omikuji`）が指示文を組み立て、**Claude** がおみくじの文章を書く（ストリーミング）
4. 文字数・不適切な表現をチェックしてから「印刷」（表：おみくじ／裏：指示文とAIのコツ）
5. 「裏側モニター」に 1〜5 の流れと、指示文・AIの答えを表示

APIキーはサーバーだけで使い、ブラウザには出しません。ページから送るのは選択肢だけで、指示文はサーバー側で作るので、キーをおみくじ以外に使われることはありません。
APIキーがない・AIが失敗したときは、用意したテンプレート文で動きます。

## 画面

| URL | 使う場所 | 内容 |
|---|---|---|
| `/omikuji` | 来場者のタッチパネル（横向き・全画面）。旧URL `/kiosk` からも転送 | スタート → あなたについて → AIの利用 → 引き出し → 演出 → 結果（自動で最初にもどる） |
| `/monitor` | ブース後方のテレビ | 裏側モニター。おみくじ画面の動きがリアルタイムで映る。体験人数・当たり残り・AI利用率も表示 |
| `/staff` | スタッフ用（PIN） | 当たりの数・効果音・自動印刷・裏面のコツ・部署・アンケート集計 |
| `/` | — | 3つの画面へのリンク |

おみくじ画面とモニターは **同じパソコンの同じブラウザ** で別ウィンドウとして開くと自動で連動します（BroadcastChannel）。
設定・カウント・アンケートもそのブラウザに保存され、3つの画面で共有されます。

### 演出の動画（Seedance など）

`public/media/` に次の名前で置くと自動で使われます。なければ内蔵のアニメーションで動きます。

| ファイル | 使う場面 |
|---|---|
| `idle.mp4` | スタート画面の背景（ループ・無音） |
| `reveal-daidaikichi.mp4` | 大大吉が出たとき |
| `reveal-daikichi.mp4` | 大吉が出たとき |
| `reveal-chukichi.mp4` | 中吉が出たとき |

`public/media/titles/` には、動画づくりの参考用に 3D 文字の画像（大大吉・大吉・中吉）が入っています。

### 印刷（80mm サーマルプリンター）

スタッフ設定で「結果画面で自動印刷する」をオンにし、Chrome を次のように起動すると、印刷ダイアログなしで既定のプリンターに出ます。

```bash
# Windows の例
chrome.exe --kiosk --kiosk-printing https://<your-app>.vercel.app/omikuji
```

## 構成

```
app/
  page.tsx               3画面へのリンク
  omikuji/ monitor/ staff/ 各画面
  api/omikuji/route.ts   Claude 呼び出し（GET: AI接続状態 / POST: おみくじ生成）
  api/staff/route.ts     スタッフPINの確認
components/
  kiosk/KioskApp.tsx     おみくじ画面の流れ
  monitor/MonitorApp.tsx 裏側モニター
  staff/StaffApp.tsx     スタッフ画面
  Cabinet / Slip / Reveal / FortuneArt / Art / StaffPanel
lib/
  omikuji.ts             抽選・指示文・チェック・コツ（画面とサーバーで共通）
  booth.ts               おみくじ画面 → モニターの連動
  sound.ts               効果音（音声ファイル不要）
  useSettings.ts         設定と記録（localStorage、ウィンドウ間で同期）
```

## ローカルで動かす

```bash
npm install
cp .env.example .env.local   # ANTHROPIC_API_KEY を入れる（なくても動く）
npm run dev                  # http://localhost:3000
```

## Vercel にデプロイ

1. Vercel で「Add New → Project」からこのリポジトリを選ぶ（Framework: Next.js は自動判定）
2. Environment Variables を追加
   - `ANTHROPIC_API_KEY`（なければテンプレート文で動作）
   - `STAFF_PIN`（スタッフ画面のPIN。既定は 1234 なので必ず変更）
   - 任意：`ANTHROPIC_MODEL`（既定 `claude-haiku-5-5`）、`NEXT_PUBLIC_GUIDE_URL`（裏面・印刷にQRコードを出すURL）
3. Deploy

## スタッフ設定

`/staff` で変更できます（その端末のブラウザに保存）。

- 想定来場者・マグカップ数（当たり確率 ＝ 残りのマグカップ ÷ 残りの想定来場者）
- 裏面に載せるAIのコツ（15個から選択、ランダム／固定）
- 部署リスト
- アンケート集計（部署 × AIの利用）と CSV コピー

## 本番前に

- 社内で承認されたAIサービス・APIキーを使う
- 端末を複数台にする場合は、当たりの数を共有の保存先（例：Vercel KV / Upstash）で管理する
- サーマルプリンターへの印刷は、ブース端末側の小さなアプリで行う
- 公開URLにする場合は、アクセス制限（Vercel の Password Protection など）を検討する
