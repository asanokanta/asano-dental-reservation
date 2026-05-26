# あさの歯科 — Manus 引き継ぎ用まとめ

このドキュメントと `manus-handoff/` フォルダを Manus に添付して、ホームページ修正のコンテキストとして使ってください。

---

## 1. プロジェクト概要

| 項目 | 内容 |
|------|------|
| 医院名 | あさの歯科（Asano Dental Clinic） |
| 所在地 | 東京都北区王子5-5-3 シーメゾン王子神谷101 |
| 最寄り | 東京メトロ南北線 王子神谷駅 2番出口 徒歩2分 |
| 電話 | 03-3913-4618 |
| 技術 | React 19 + Vite 7 + TypeScript + Tailwind CSS 4 |
| ルーティング | wouter |

---

## 2. 起動方法

```bash
npm install
npm run dev
# → http://localhost:3000
```

本番:

```bash
npm run build
ADMIN_PASSWORD=your-secret npm start
```

---

## 3. ページ構成（URL）

| URL | ファイル | 説明 |
|-----|----------|------|
| `/` | `client/src/pages/Home.tsx` | **ホームページ（修正対象の中心）** |
| `/reserve` | `client/src/pages/Reserve.tsx` | 患者向けネット予約（診察券番号→日時→確定） |
| `/admin` | `client/src/pages/Admin.tsx` | 医院向け管理（患者登録・予約一覧） |
| `/reserve/index.php` | `reserve/index.php` | PHP版の番号チェック（レガシー） |

---

## 4. ホームページのセクション構成

`Home.tsx` が以下を上から順に表示:

1. **Header** — ロゴ +「あさの歯科」+ ナビ + 電話 + ネット予約ボタン
2. **HeroSection** — メインビジュアル・キャッチコピー
3. **NewsSection** — お知らせ
4. **FeaturesSection** — 当院の特徴（3つ）
5. **ServicesSection** — 診療案内（一般・予防・ホワイトニング・インプラント）
6. **HoursSection** — 診療時間表
7. **DoctorSection** — 院長紹介
8. **AccessSection** — Googleマップ・アクセス
9. **Footer**
10. **MobileFixedBar** — スマホ下部固定（電話・ネット予約）

---

## 5. デザイン（カラーパレット）

ロゴに合わせた**優しいクリーム×グリーン×イエロー**。

定義: `client/src/index.css` の `:root`

| 名前 | 色 | Tailwind クラス例 |
|------|-----|-------------------|
| クリーム背景 | `#FEF9E7` | `bg-cream` |
| カード背景 | `#FFFCF5` | `bg-card` |
| メイングリーン | `#66BB6A` | `bg-brand` `text-brand` |
| 濃いグリーン | `#4CAF50` | `bg-brand-dark` |
| アクセント黄 | `#FFD54F` | `bg-accent` `bg-accent-light` |
| 本文テキスト | `#5C5748` | `text-warm` |
| 補助テキスト | `#8A8575` | `text-warm-muted` |
| フッター | `#4A7A4E` | `bg-footer` |

フォント:

- 本文: Noto Sans JP
- 見出し: Noto Serif JP
- ヘッダー医院名: Zen Maru Gothic（丸ゴシック）

ロゴ画像: `client/public/images/asano-logo.png`（円形ライオンロゴ）

---

## 6. これまでに実装した主な変更

### ホームページ UI

- [x] ヘッダー左にロゴ、右に「あさの歯科」（Zen Maru Gothic）
- [x] 全体をクリーム系の優しい色味に変更
- [x] ネット予約リンクを `/reserve` に統一（JMDC 直リンクから変更）

### ネット予約システム（自作）

- [x] 診察券番号照合（`data/patient_list.csv`）
- [x] 日付・時間枠選択して予約（`data/reservations.json`）
- [x] 医院管理画面 `/admin`（患者登録・予約キャンセル）
- [x] 初診者は電話予約の案内

### 設定ファイル

- 電話・予約関連: `shared/reserve.ts` `shared/booking.ts`
- 管理パスワード: 環境変数 `ADMIN_PASSWORD`（初期 `asano-admin`）

---

## 7. ソースファイル一覧（`manus-handoff/` にコピー済み）

```
manus-handoff/
├── README.md                    ← 本ファイルのコピー
├── package.json
├── tsconfig.json
├── vite.config.ts
├── .env.example
├── ideas.md                     ← デザイン案メモ（参考）
├── client/
│   ├── index.html
│   ├── public/images/asano-logo.png
│   └── src/
│       ├── index.css            ★ 色・スタイルの中心
│       ├── App.tsx              ★ ルート定義
│       ├── main.tsx
│       ├── pages/
│       │   ├── Home.tsx         ★ ホームページ
│       │   ├── Reserve.tsx
│       │   └── Admin.tsx
│       └── components/
│           ├── Header.tsx       ★ ヘッダー
│           ├── HeroSection.tsx  ★ トップ
│           ├── FeaturesSection.tsx
│           ├── ServicesSection.tsx
│           ├── HoursSection.tsx
│           ├── DoctorSection.tsx
│           ├── AccessSection.tsx
│           ├── NewsSection.tsx
│           ├── Footer.tsx
│           ├── MobileFixedBar.tsx
│           └── Map.tsx
├── shared/
│   ├── reserve.ts
│   └── booking.ts
├── server/
│   ├── index.ts
│   ├── api.ts
│   ├── patientCsv.ts
│   └── bookingStore.ts
├── data/
│   ├── patient_list.csv
│   └── reservations.json
├── reserve/
│   ├── index.php
│   └── config.php
└── docs/
    ├── BOOKING.md
    ├── RESERVE.md
    └── MANUS_HANDOFF.md
```

※ `client/src/components/ui/`（ボタン等のUI部品）は未コピー。必要なら元プロジェクトから参照。

---

## 8. API 一覧（バックエンド）

| メソッド | パス | 用途 |
|----------|------|------|
| POST | `/api/reserve/validate` | 診察券番号照合 |
| GET | `/api/reserve/dates` | 予約可能日一覧 |
| GET | `/api/reserve/slots?date=YYYY-MM-DD` | 空き時間枠 |
| POST | `/api/reserve/book` | 予約確定 |
| GET | `/api/admin/patients` | 患者一覧（要認証） |
| POST | `/api/admin/patients` | 患者登録 |
| DELETE | `/api/admin/patients/:id` | 患者削除 |
| GET | `/api/admin/reservations` | 予約一覧 |
| DELETE | `/api/admin/reservations/:id` | 予約キャンセル |

認証: `Authorization: Bearer {ADMIN_PASSWORD}`

---

## 9. Manus で修正するときの注意

1. **ホームページだけ直す場合**  
   主に `client/src/pages/Home.tsx` と `client/src/components/*.tsx`、`client/src/index.css` を編集。

2. **色を変える場合**  
   `index.css` の `:root` と Tailwind クラス（`bg-brand` 等）をセットで変更。

3. **ネット予約の流れは壊さない**  
   「ネット予約」ボタンのリンク先は `/reserve` のまま推奨。

4. **ロゴ**  
   `/images/asano-logo.png` を参照。パスを変える場合は `Header.tsx` も更新。

5. **外部画像**  
   Hero 等で CloudFront URL の画像を使用している箇所あり（`HeroSection.tsx` 等）。

---

## 10. Manus への添付方法

### おすすめ

1. **`docs/MANUS_HANDOFF.md`**（本ファイル）を添付
2. **`manus-handoff/` フォルダを ZIP に圧縮**して添付  
   ```bash
   cd "プロジェクトフォルダ"
   zip -r asano-dental-handoff.zip manus-handoff docs/MANUS_HANDOFF.md
   ```

### プロンプト例（Manus に貼る）

```
あさの歯科の歯科医院ホームページを修正してください。
添付の MANUS_HANDOFF.md とソースコードを参照してください。

- 技術: React + Vite + Tailwind CSS 4
- ホームページ: client/src/pages/Home.tsx と components/
- デザイン: クリーム背景 #FEF9E7、グリーン #66BB6A、丸ゴシック
- ネット予約は /reserve（変更しない）

【今回の修正内容】
（ここに具体的な要望を書く）
```

---

## 11. 医院情報（コンテンツ参照用）

- 院長: あさの ひでゆき
- 診療: 一般歯科・予防歯科・インプラント・ホワイトニング
- 設備: 3DデジタルCT、口腔内スキャナー、マイクロスコープ
- 予約: 完全予約制
- 休診: 日曜・祝日・水曜午前・第2/4/5木曜・第1/3土曜 等（HoursSection 参照）

---

*最終更新: 自作予約システム・優しいカラーパレット・ロゴヘッダー実装後*
