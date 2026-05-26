import express from "express";
import { createClient } from "@supabase/supabase-js";
import { getAvailableDates } from "../shared/booking";

const app = express();
app.use(express.json());

app.get("/api/diagnostics", async (req, res) => {
  try {
    const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
    const { count } = await sb.from("reservations").select("*", { count: "exact", head: true });
    const dates = getAvailableDates(true);
    res.json({ ok: true, reservationCount: count, datesCount: dates.length });
  } catch (e: any) {
    res.status(500).json({ error: e.message, stack: e.stack?.split("\n").slice(0, 5) });
  }
});

export default app;
