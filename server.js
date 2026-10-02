import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();

import adminRoutes from "./backend/src/routes/admin.js";
import mpesaRoutes from "./backend/src/routes/mpesa.js";
import paymentsRoutes from "./backend/src/routes/payments.js";

async function startServer() {
  const app = express();
  const PORT = 3000;
  const HOST = "0.0.0.0";

  app.use(cors({ origin: process.env.FRONTEND_URL || "*" }));
  app.use(express.json());

  // API endpoints
  app.get("/health", (req, res) => res.json({ ok: true, service: "loansync-app" }));
  app.use("/api/admin", adminRoutes);
  app.use("/api/mpesa", mpesaRoutes);
  app.use("/api/payments", paymentsRoutes);

  // Frontend serving
  const distDir = path.resolve(__dirname, "dist");
  const isProduction = process.env.NODE_ENV === "production";

  if (!isProduction && !fs.existsSync(path.resolve(distDir, "index.html"))) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: "spa",
      root: path.resolve(__dirname, "frontend"),
    });

    app.use(vite.middlewares);

    app.use(async (req, res, next) => {
      if (req.method !== "GET" && req.method !== "HEAD") return next();
      try {
        const url = req.originalUrl;
        let template = fs.readFileSync(path.resolve(__dirname, "frontend/index.html"), "utf-8");
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    app.use(express.static(distDir));
    app.use((req, res) => {
      res.sendFile(path.resolve(distDir, "index.html"));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`LoanSync server running on http://${HOST}:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
