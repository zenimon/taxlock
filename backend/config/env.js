/**
 * config/env.js
 *
 * Single source of truth for all environment variables.
 * Every variable is validated at startup — a missing required value
 * throws immediately rather than producing cryptic runtime errors.
 */

import dotenv from "dotenv";
dotenv.config();

function required(key) {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

function optional(key, defaultValue) {
  return process.env[key] ?? defaultValue;
}

export const config = {
  // Server
  PORT: optional("PORT", "3000"),
  NODE_ENV: optional("NODE_ENV", "development"),

  // Auth
  API_KEY_SECRET: optional("API_KEY_SECRET", "dev-secret-change-in-production"),
  JWT_SECRET: optional("JWT_SECRET", "dev-jwt-secret"),
  JWT_EXPIRES_IN: optional("JWT_EXPIRES_IN", "24h"),

  // Database
  DATABASE_URL: optional("DATABASE_URL", "postgresql://localhost:5432/decision_api"),

  // CORS
  ALLOWED_ORIGINS: optional("ALLOWED_ORIGINS", "*").split(","),

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: parseInt(optional("RATE_LIMIT_WINDOW_MS", "60000")),
  RATE_LIMIT_MAX: parseInt(optional("RATE_LIMIT_MAX", "100")),

  // Webhook delivery
  WEBHOOK_TIMEOUT_MS: parseInt(optional("WEBHOOK_TIMEOUT_MS", "5000")),
  WEBHOOK_RETRY_ATTEMPTS: parseInt(optional("WEBHOOK_RETRY_ATTEMPTS", "3")),

  // Simulation engine
  SIMULATION_MAX_PERIODS: parseInt(optional("SIMULATION_MAX_PERIODS", "60")),

  // Risk thresholds (defaults, overridden per-tenant via rules)
  DEFAULT_RISK_HIGH_THRESHOLD: parseFloat(optional("DEFAULT_RISK_HIGH_THRESHOLD", "0.75")),
  DEFAULT_RISK_MEDIUM_THRESHOLD: parseFloat(optional("DEFAULT_RISK_MEDIUM_THRESHOLD", "0.40")),
};
