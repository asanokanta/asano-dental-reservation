export default function handler(req: any, res: any) {
  res.json({
    ok: true,
    env: {
      SUPABASE_URL: process.env.SUPABASE_URL ? "set" : "missing",
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? "set" : "missing",
    }
  });
}
