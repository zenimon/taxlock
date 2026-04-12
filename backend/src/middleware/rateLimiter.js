/**
 * middleware/rateLimiter.js
 *
 * Sliding window rate limiter using express-rate-limit.
 * Applied to all /api/ routes. Limits are per-IP in dev,
 * per API key in production (configured in the handler below).
 */

import rateLimit from "express-rate-limit";
import { config } from "../../config/env.js";

export const rateLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX,
  standardHeaders: true,    // Return rate limit info in RateLimit-* headers
  legacyHeaders: false,
  keyGenerator: (req) => req.tenant?.id ?? req.ip,
  handler: (req, res) => {
    res.status(429).json({
      error: {
        code: "RATE_LIMIT_EXCEEDED",
        message: `Too many requests — limit is ${config.RATE_LIMIT_MAX} per ${config.RATE_LIMIT_WINDOW_MS / 1000}s`,
      },
    });
  },
});
