import "dotenv/config";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "./routers";
import { createContext } from "./_core/context";
import { refreshSubmissionSchema, ingestRefresh } from "./tracker";

export function createApp() {
  const app = express();
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ limit: "2mb", extended: true }));

  app.get("/api/health", (_req, res) => res.json({ ok: true, service: "vacancy-agent-site" }));

  app.post("/api/research/import", async (req, res) => {
    const configuredToken = process.env.RESEARCH_IMPORT_TOKEN;
    if (!configuredToken) return res.status(503).json({ error: "Research agent import is not configured" });
    const supplied = req.header("authorization")?.replace(/^Bearer\s+/i, "");
    if (!supplied || supplied !== configuredToken) return res.status(401).json({ error: "Unauthorized" });
    try {
      const payload = refreshSubmissionSchema.parse(req.body);
      const result = await ingestRefresh(payload);
      return res.status(200).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return res.status(400).json({ error: message });
    }
  });

  app.use("/api/trpc", createExpressMiddleware({ router: appRouter, createContext }));
  return app;
}
