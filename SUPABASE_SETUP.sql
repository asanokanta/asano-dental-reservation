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

-- 患者名簡テーブルの作成
CREATE TABLE IF NOT EXISTS patients (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'normal',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 患者テーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_patients_status ON patients(status);

-- RLS（Row Level Security）の有効化
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- 予約テーブル: 全员が読み取り可能、全员が作成・更新・削除可能
CREATE POLICY "Allow read access to all" ON reservations
  FOR SELECT USING (true);

CREATE POLICY "Allow insert for all" ON reservations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update for all" ON reservations
  FOR UPDATE USING (true);

CREATE POLICY "Allow delete for all" ON reservations
  FOR DELETE USING (true);

-- 患者テーブル: 全员が読み取り可能、全员が作成・更新・削除可能
CREATE POLICY "Allow read access to patients" ON patients
  FOR SELECT USING (true);

CREATE POLICY "Allow insert for patients" ON patients
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update for patients" ON patients
  FOR UPDATE USING (true);

CREATE POLICY "Allow delete for patients" ON patients
  FOR DELETE USING (true);
