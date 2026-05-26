# ネット予約ゲート（診察券番号照合）

## 概要

再診の方のみ、診察券番号（診察券番号）を照合してから外部予約システムへ進みます。

## 患者リスト（CSV）

`data/patient_list.csv` を編集してください。

```csv
診察券番号,氏名,ステータス
12345,山田太郎,normal
67890,迷惑次郎,blocked
```

- `normal` … 予約ページへ転送
- `blocked` … ブロック（電話案内のエラー表示）
- リストにない番号 … エラー表示

## テスト用番号

| 番号 | 結果 |
|------|------|
| 12345 | 予約ページへ転送（normal） |
| 67890 | ブロックエラー |
| その他 | 番号が見つかりません |

## 設定の変更

- **予約先URL** … `shared/reserve.ts` の `RESERVE_REDIRECT_URL` および `reserve/config.php`
- **電話番号** … `shared/reserve.ts` の `CLINIC_PHONE` および `reserve/config.php`

## 使い方

### 開発（Vite）

```bash
npm run dev
```

→ http://localhost:3000/reserve

### 本番（Node.js）

```bash
npm run build && npm start
```

### PHPサーバー（Apache 等）

`reserve/index.php` と `data/patient_list.csv` をアップロードし、  
`https://あなたのドメイン/reserve/` で公開します。

トップページの「ネット予約」リンクは `/reserve`（React）または `/reserve/index.php`（PHP）を指します。
