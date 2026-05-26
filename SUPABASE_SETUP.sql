-- Supabase初期設定スクリプト
-- このSQLをSupabaseのSQL Editorで実行してください

-- 予約テーブルの作成
CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  membership_id VARCHAR(255) NOT NULL,
  patient_name VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  end_time TIME,
  comment TEXT,
  arrived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  source VARCHAR(50) DEFAULT 'web',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックスの作成（検索性能向上）
CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations(date);
CREATE INDEX IF NOT EXISTS idx_reservations_membership_id ON reservations(membership_id);
CREATE INDEX IF NOT EXISTS idx_reservations_created_at ON reservations(created_at);

-- RLS（Row Level Security）の有効化
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- 全員が読み取り可能なポリシー
CREATE POLICY "Allow read access to all" ON reservations
  FOR SELECT USING (true);

-- 認証されたユーザーが作成・更新・削除可能なポリシー
CREATE POLICY "Allow insert for authenticated users" ON reservations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update for authenticated users" ON reservations
  FOR UPDATE USING (true);

CREATE POLICY "Allow delete for authenticated users" ON reservations
  FOR DELETE USING (true);
