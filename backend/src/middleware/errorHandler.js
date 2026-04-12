/**
 * middleware/errorHandler.js
 *
 * Global Express error handler. Converts all errors — both known AppErrors
 * and unexpected runtime errors — into a consistent JSON response shape.
 *
 * Never leaks stack traces or internal details in production.
 */

import { AppError } from "../utils/AppError.js";

export function errorHandler(err, req, res, next) {
  const isProd = process.env.NODE_ENV === "production";

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      },
    });
  }

  // Unexpected error — log full details server-side, return safe message client-side
  console.error("[UnhandledError]", err);

  return res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: isProd ? "An unexpected error occurred" : err.message,
      ...(isProd ? {} : { stack: err.stack }),
    },
  });
}
