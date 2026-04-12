/**
 * Decision API — Entry Point
 *
 * Boots the Express server, registers all middleware, mounts routes,
 * and starts listening. In production this file is run directly;
 * in tests it is imported so the server can be started/stopped programmatically.
 */

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";

import { config } from "../config/env.js";
import { rateLimiter } from "./middleware/rateLimiter.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { authenticate } from "./middleware/authenticate.js";

import transactionRoutes from "./routes/transaction.routes.js";
import rulesRoutes from "./routes/rules.routes.js";
import simulationRoutes from "./routes/simulation.routes.js";
import webhookRoutes from "./routes/webhook.routes.js";
import healthRoutes from "./routes/health.routes.js";

import { swaggerSpec } from "./docs/swagger.js";

const app = express();

// ── Security & parsing ──────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: config.ALLOWED_ORIGINS }));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// ── Logging ─────────────────────────────────────────────────────────────────
app.use(morgan("combined"));
app.use(requestLogger);

// ── Rate limiting ────────────────────────────────────────────────────────────
app.use("/api/", rateLimiter);

// ── API Documentation (Swagger UI) ───────────────────────────────────────────
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: "Decision API Docs",
  customCss: ".swagger-ui .topbar { display: none }",
}));
app.get("/docs.json", (req, res) => res.json(swaggerSpec));

// ── Public routes (no auth) ──────────────────────────────────────────────────
app.use("/api/v1/health", healthRoutes);

// ── Authenticated routes ─────────────────────────────────────────────────────
app.use("/api/v1", authenticate);
app.use("/api/v1/transaction", transactionRoutes);
app.use("/api/v1/rules", rulesRoutes);
app.use("/api/v1/simulate", simulationRoutes);
app.use("/api/v1/webhooks", webhookRoutes);

// ── Global error handler (must be last) ──────────────────────────────────────
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== "test") {
  app.listen(config.PORT, () => {
    console.log(`Decision API running on port ${config.PORT}`);
    console.log(`Docs available at http://localhost:${config.PORT}/docs`);
  });
}

export default app;
