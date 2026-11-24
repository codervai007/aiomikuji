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

## 構成

```
app/
  layout.tsx           フォント・メタ情報
  page.tsx
  globals.css          デザイン
  api/omikuji/route.ts Claude 呼び出し（GET: AI接続状態 / POST: おみくじ生成）
components/
  OmikujiApp.tsx       画面全体と流れ
  Cabinet.tsx          御神籤の棚（引き出し 一〜百）
  Slip.tsx             おみくじの紙（表・裏）
  Monitor.tsx          裏側モニター
  StaffPanel.tsx       スタッフ設定・アンケート集計
lib/
  omikuji.ts           抽選・指示文・チェック・コツ（画面とサーバーで共通）
  useSettings.ts       設定と記録（ブラウザの localStorage）
```

## ローカルで動かす

```bash
npm install
cp .env.example .env.local   # ANTHROPIC_API_KEY を入れる（なくても動く）
npm run dev                  # http://localhost:3000
```

## Vercel にデプロイ

1. Vercel で「Add New → Project」からこのリポジトリを選ぶ（Framework: Next.js は自動判定）
2. Environment Variables に `ANTHROPIC_API_KEY` を追加（任意で `ANTHROPIC_MODEL`、既定は `claude-haiku-5-5`）
3. Deploy

## スタッフ設定

ページ下部の「スタッフ設定」で変更できます（その端末のブラウザに保存）。

- 想定来場者・マグカップ数（当たり確率 ＝ 残りのマグカップ ÷ 残りの想定来場者）
- 裏面に載せるAIのコツ（15個から選択、ランダム／固定）
- 部署リスト
- アンケート集計（部署 × AIの利用）と CSV コピー

## 本番前に

- 社内で承認されたAIサービス・APIキーを使う
- 端末を複数台にする場合は、当たりの数を共有の保存先（例：Vercel KV / Upstash）で管理する
- サーマルプリンターへの印刷は、ブース端末側の小さなアプリで行う
- 公開URLにする場合は、アクセス制限（Vercel の Password Protection など）を検討する
