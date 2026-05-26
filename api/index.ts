// Vercel Serverless Function entry point
import type { IncomingMessage, ServerResponse } from "node:http";

let appHandler: ((req: IncomingMessage, res: ServerResponse) => void) | null = null;
let initError: string | null = null;

async function loadApp() {
  if (appHandler) return appHandler;
  if (initError) throw new Error(initError);
  try {
    const mod = await import("../server/index.js");
    appHandler = mod.default as typeof appHandler;
    return appHandler;
  } catch (e: any) {
    initError = String(e?.stack || e);
    throw e;
  }
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const app = await loadApp();
    app!(req, res);
  } catch (e: any) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({
      error: "Server initialization failed",
      detail: String(e?.message || e),
      env: {
        SUPABASE_URL: process.env.SUPABASE_URL ? "set" : "missing",
        SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? "set" : "missing",
      }
    }));
  }
}
