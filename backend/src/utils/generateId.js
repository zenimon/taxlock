/**
 * utils/generateId.js
 *
 * Generates short, URL-safe, prefixed IDs.
 * Format: {prefix}_{8 random hex chars}
 * Example: alloc_9f2c1d3b
 *
 * In production, swap for UUIDs or ULID if you need global uniqueness guarantees.
 */

import { randomBytes } from "crypto";

export function generateId(prefix = "id") {
  return `${prefix}_${randomBytes(4).toString("hex")}`;
}
