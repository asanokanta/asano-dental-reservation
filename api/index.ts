import express from "express";
import { createClient } from "@supabase/supabase-js";

const app = express();
app.use(express.json());

app.get("/api/diagnostics", async (req, res) => {
  try {
    const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
    const { count } = await sb.from("reservations").select("*", { count: "exact", head: true });
    res.json({ ok: true, count });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default app;
