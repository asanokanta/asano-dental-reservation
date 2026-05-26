import express from "express";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { handleApi } from "./api.js";
import { startCleanupScheduler } from "./cleanupScheduler.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);

  app.use(express.json());

  app.all("/api/*", async (req, res, next) => {
    const handled = await handleApi(req, res, req.originalUrl || req.url || "");
    if (!handled) next();
  });

  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = process.env.PORT || 3000;

  const stopCleanup = startCleanupScheduler();

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    console.log(`Admin: http://localhost:${port}/admin`);
  });

  process.on("SIGTERM", () => {
    console.log("SIGTERM received, shutting down gracefully...");
    stopCleanup();
    server.close(() => {
      console.log("Server closed");
      process.exit(0);
    });
  });
}

startServer().catch(console.error);
