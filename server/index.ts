import express from "express";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import { handleApi } from "./api.js";
import { startCleanupScheduler } from "./cleanupScheduler.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

app.all("/api/*", async (req, res, next) => {
  const handled = await handleApi(req, res, req.originalUrl || req.url || "");
  if (!handled) next();
});

const staticPath = process.env.NODE_ENV === "production"
  ? path.resolve(__dirname, "public")
  : path.resolve(__dirname, "..", "dist", "public");

app.use(express.static(staticPath));

app.get("*", (_req, res) => {
  // Vercel環境では静的ファイルはVercelが処理するため、ここはAPI以外のフォールバック
  const indexPath = path.join(staticPath, "index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send("Not found");
  }
});

if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  const port = process.env.PORT || 3000;
  const server = createServer(app);
  const stopCleanup = startCleanupScheduler();

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });

  process.on("SIGTERM", () => {
    stopCleanup();
    server.close(() => process.exit(0));
  });
}

export default app;
