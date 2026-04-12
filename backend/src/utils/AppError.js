/**
 * utils/AppError.js
 *
 * Typed application error. Thrown from services and controllers
 * to produce consistent JSON error responses via the global error handler.
 *
 * Usage:
 *   throw new AppError("NOT_FOUND", "Rule not found", 404);
 *   throw new AppError("VALIDATION_ERROR", "amount must be positive", 400, { field: "amount" });
 */

export class AppError extends Error {
  /**
   * @param {string} code     — Machine-readable error code (e.g. "NOT_FOUND")
   * @param {string} message  — Human-readable description
   * @param {number} statusCode — HTTP status code
   * @param {object} [details]  — Optional extra context
   */
  constructor(code, message, statusCode = 500, details = null) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}
