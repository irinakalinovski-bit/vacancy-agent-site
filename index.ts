import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createApp } from "./server/app";

const app = createApp();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, "dist", "public");

app.use(express.static(distPath));
app.get("*", (_req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

export default app;
