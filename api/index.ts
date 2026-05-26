// Vercel Serverless Function
import express from "express";

const app = express();
app.use(express.json());

app.get("/api/diagnostics", (req, res) => {
  res.json({
    ok: true,
    env: {
      SUPABASE_URL: process.env.SUPABASE_URL ? "set" : "missing",
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? "set" : "missing",
    }
  });
});

export default app;
