# あさの歯科 予約システム - デプロイメントガイド

このガイドでは、予約システムをSupabase（データベース）とVercel（ホスティング）を使用して本番環境に公開する手順を説明します。

## 前提条件

- GitHubアカウント（既に作成済み）
- Supabaseアカウント
- Vercelアカウント

## ステップ1: Supabaseの初期設定

### 1.1 Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com/) にアクセスします
2. GitHubアカウントでログインします
3. 「New Project」をクリックします
4. 以下の情報を入力します：
   - **Project name**: `asano-dental` （またはお好みの名前）
   - **Database Password**: 安全なパスワードを設定します
   - **Region**: `Asia Pacific (Singapore)` または最寄りのリージョンを選択

### 1.2 データベーステーブルの作成

1. Supabaseダッシュボードにログインします
2. 左側メニューの「SQL Editor」をクリックします
3. 「New Query」をクリックします
4. `SUPABASE_SETUP.sql` ファイルの内容をコピーして貼り付けます
5. 「Run」ボタンをクリックして実行します

### 1.3 APIキーの取得

1. 左側メニューの「Project Settings」をクリックします
2. 「API」タブをクリックします
3. 以下の情報をコピーして保存します：
   - **Project URL** → これが `SUPABASE_URL` です
   - **anon public** キー → これが `SUPABASE_ANON_KEY` です

## ステップ2: Vercelへのデプロイ

### 2.1 Vercelプロジェクトの作成

1. [Vercel](https://vercel.com/) にアクセスします
2. GitHubアカウントでログインします
3. 「New Project」をクリックします
4. GitHubから `asano-dental-reservation` リポジトリを選択します

### 2.2 環境変数の設定

デプロイ前に、以下の環境変数を設定します：

1. プロジェクト設定画面で「Environment Variables」セクションを探します
2. 以下の変数を追加します：

| 変数名 | 値 | 説明 |
| --- | --- | --- |
| `SUPABASE_URL` | Supabaseから取得したProject URL | データベースのURL |
| `SUPABASE_ANON_KEY` | Supabaseから取得したanon keyキー | データベースのAPIキー |
| `ADMIN_PASSWORD` | `asano-admin` | 管理画面のパスワード |

### 2.3 デプロイ

1. 「Deploy」ボタンをクリックします
2. デプロイが完了するまで待ちます（通常3～5分）
3. デプロイ完了後、表示されるURLがあなたの本番サイトです

## ステップ3: 動作確認

### 3.1 予約ページへのアクセス

1. Vercelから提供されたURLにアクセスします
2. 「予約」ボタンをクリックして、Web予約が正常に機能することを確認します
3. 予約を作成してみます

### 3.2 管理画面へのアクセス

1. URLの末尾に `/admin` を追加してアクセスします
2. パスワード `asano-admin` でログインします
3. 予約一覧が表示されることを確認します

## トラブルシューティング

### エラー: "SUPABASE_URL is not defined"

**原因**: 環境変数が正しく設定されていません

**解決方法**:
1. Vercelプロジェクト設定で「Environment Variables」を確認します
2. `SUPABASE_URL` と `SUPABASE_ANON_KEY` が正しく設定されているか確認します
3. 設定後、再度デプロイします

### エラー: "Failed to connect to database"

**原因**: Supabaseのプロジェクトがまだ起動していないか、キーが間違っています

**解決方法**:
1. Supabaseダッシュボードでプロジェクトが「Active」状態か確認します
2. APIキーが正しくコピーされているか確認します
3. Supabaseの「Project Settings」→「API」で再度確認します

### 予約データが保存されない

**原因**: Supabaseのテーブルが作成されていません

**解決方法**:
1. Supabaseダッシュボードの「SQL Editor」を開きます
2. 「SUPABASE_SETUP.sql」の内容を再度実行します
3. 「Table Editor」で `reservations` テーブルが存在することを確認します

## カスタマイズ

### 管理画面のパスワード変更

1. Vercelプロジェクト設定で「Environment Variables」を開きます
2. `ADMIN_PASSWORD` の値を新しいパスワードに変更します
3. 変更を保存すると、自動的に再デプロイされます

### ドメイン設定

1. Vercelプロジェクト設定で「Domains」セクションを開きます
2. 「Add Domain」をクリックします
3. あなたのドメイン（例: `reserve.asano-dental.com`）を入力します
4. DNS設定の指示に従います

## 定期メンテナンス

### バックアップ

Supabaseは自動的にバックアップを取得しますが、手動バックアップも可能です：

1. Supabaseダッシュボードで「Database」セクションを開きます
2. 「Backups」タブをクリックします
3. 「Create backup」をクリックします

### ログの確認

1. Vercelプロジェクトで「Deployments」タブを開きます
2. 各デプロイのログを確認できます

## サポート

問題が発生した場合：

1. [Supabase ドキュメント](https://supabase.com/docs)
2. [Vercel ドキュメント](https://vercel.com/docs)
3. GitHubのIssueセクションで質問を投稿してください

---

**重要**: 本番環境では、定期的にバックアップを取得し、セキュリティアップデートを確認してください。
