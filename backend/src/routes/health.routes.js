/**
 * routes/health.routes.js
 * No authentication required — used by load balancers and uptime monitors.
 */
import { Router } from "express";
const router = Router();

router.get("/", async (req, res) => {
  res.json({
    status: "ok",
    version: "1.0.0",
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

export default router;
