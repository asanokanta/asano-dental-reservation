-- anon / authenticated ロールへの権限付与（未設定の場合に実行）
-- SupabaseのSQL Editorにコピーして実行してください
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reservations TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.patients TO anon, authenticated;
