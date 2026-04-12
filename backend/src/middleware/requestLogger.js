/**
 * middleware/requestLogger.js
 *
 * Attaches a unique request ID to each request and logs
 * method, path, tenant ID, and response time on completion.
 */
import { randomUUID } from "crypto";

export function requestLogger(req, res, next) {
  req.requestId = randomUUID();
  res.setHeader("X-Request-Id", req.requestId);

  const start = Date.now();
  res.on("finish", () => {
    const ms = Date.now() - start;
    console.log(
      `[${req.requestId}] ${req.method} ${req.path} ${res.statusCode} ${ms}ms tenant=${req.tenant?.id ?? "anon"}`
    );
  });

  next();
}
