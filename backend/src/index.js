/**
 * TaxFlow — Entry Point
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
import { connectDatabase } from "../config/database.js";
import { TenantRepository } from "./models/tenant.repository.js";

import transactionRoutes from "./routes/transaction.routes.js";
import rulesRoutes from "./routes/rules.routes.js";
import simulationRoutes from "./routes/simulation.routes.js";
import webhookRoutes from "./routes/webhook.routes.js";
import healthRoutes from "./routes/health.routes.js";
import authRoutes from "./routes/auth.routes.js";

import { swaggerSpec } from "./docs/swagger.js";
import { seedAll } from "./utils/seedData.js";

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
  customSiteTitle: "TaxFlow API Docs",
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .highlight-code pre { background: #1a1a1a !important; color: #ffffff !important; }
    .swagger-ui .highlight-code code { color: #ffffff !important; }
    .swagger-ui .microlight { background: #1a1a1a !important; color: #ffffff !important; }
  `,
}));
app.get("/docs.json", (req, res) => res.json(swaggerSpec));

// ── Public routes (no auth) ──────────────────────────────────────────────────
app.use("/api/v1/health", healthRoutes);
app.use("/api/v1/auth", authRoutes);

// ── Development routes ───────────────────────────────────────────────────────
if (process.env.NODE_ENV !== "production") {
  app.get("/api/v1/seed", async (req, res, next) => {
    try {
      const result = await seedAll();
      res.json(result);
    } catch (err) {
      next(err);
    }
  });
}

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
  // Connect to database before starting
  connectDatabase().then(async () => {
    const server = app.listen(config.PORT, async () => {
      console.log(`TaxFlow running on port ${config.PORT}`);
      console.log(`Docs available at http://localhost:${config.PORT}/docs`);

      // Auto-seed in non-production environments
      if (process.env.NODE_ENV !== "production") {
        try {
          // Always seed base tenants first
          await TenantRepository.seed();
          await seedAll();
          console.log("Development data seeded automatically on startup.");
        } catch (err) {
          console.error("Failed to auto-seed data:", err);
        }
      }
    });

    server.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        console.error(`Error: Port ${config.PORT} is already in use.`);
        console.error(`Please kill the process using port ${config.PORT} or use a different port.`);
        process.exit(1);
      } else {
        throw err;
      }
    });
  });
}

export default app;
