import express from "express";
import { handleApi } from "../server/api.js";
import { startCleanupScheduler } from "../server/cleanupScheduler.js";

const app = express();
app.use(express.json());

// APIハンドラーの設定
app.all("/api/*", async (req, res, next) => {
  try {
    const handled = await handleApi(req, res, req.originalUrl || req.url || "");
    if (!handled) {
      res.status(404).json({ error: "API route not found" });
    }
  } catch (error) {
    console.error("API error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// スケジューラーの開始（Vercel Serverless環境では限定的ですが起動時に実行）
startCleanupScheduler();

export default app;
