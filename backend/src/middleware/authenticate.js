/**
 * middleware/authenticate.js
 *
 * API key authentication middleware.
 * Extracts the key from X-API-Key header, looks up the tenant,
 * and attaches req.tenant for downstream use.
 */

import { TenantRepository } from "../models/tenant.repository.js";
import { AppError } from "../utils/AppError.js";

export async function authenticate(req, res, next) {
  const apiKey = req.headers["x-api-key"];

  if (!apiKey) {
    return next(new AppError("UNAUTHORIZED", "X-API-Key header is required", 401));
  }

  try {
    const tenant = await TenantRepository.findByApiKey(apiKey);
    if (!tenant) {
      return next(new AppError("UNAUTHORIZED", "Invalid API key", 401));
    }
    req.tenant = tenant;
    next();
  } catch (err) {
    next(err);
  }
}
