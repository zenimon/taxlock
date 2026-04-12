/**
 * models/transaction.repository.js
 *
 * Data access layer for transaction and allocation records.
 *
 * All methods are database-agnostic stubs — swap the internals for
 * any Postgres client (pg, Prisma, Drizzle) without touching service logic.
 * The in-memory Map below lets the entire server run for local development
 * and tests with zero external dependencies.
 */

import { generateId } from "../utils/generateId.js";

// In-memory store — replace with DB queries in production
const store = {
  allocations: new Map(),       // key: allocationId
  idempotencyKeys: new Map(),   // key: `${tenantId}:${key}` → allocationId
  bucketBalances: new Map(),    // key: tenantId → { tax, operations, growth }
};

export class TransactionRepository {
  /**
   * Save a completed allocation decision.
   */
  static async saveAllocation(tenantId, allocation, idempotencyKey = null) {
    const record = { ...allocation, tenantId };
    store.allocations.set(allocation.allocationId, record);

    if (idempotencyKey) {
      store.idempotencyKeys.set(`${tenantId}:${idempotencyKey}`, record);
    }

    // Update bucket balances
    await TransactionRepository._updateBucketBalances(tenantId, allocation.allocations);

    return record;
  }

  /**
   * Find a cached allocation by idempotency key.
   */
  static async findByIdempotencyKey(tenantId, key) {
    return store.idempotencyKeys.get(`${tenantId}:${key}`) ?? null;
  }

  /**
   * Paginated list of allocations for a tenant.
   */
  static async listAllocations(tenantId, { page, limit, from, to, bucket }) {
    let records = [...store.allocations.values()]
      .filter((r) => r.tenantId === tenantId)
      .sort((a, b) => new Date(b.processedAt) - new Date(a.processedAt));

    if (from) records = records.filter((r) => r.processedAt >= from);
    if (to)   records = records.filter((r) => r.processedAt <= to);
    if (bucket) records = records.filter((r) =>
      r.allocations.some((a) => a.bucket === bucket)
    );

    const total = records.length;
    const data = records.slice((page - 1) * limit, page * limit);

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Current bucket balances for a tenant.
   */
  static async getBucketBalances(tenantId) {
    return store.bucketBalances.get(tenantId) ?? {
      tax:        { balance: 0, percentage: 0 },
      operations: { balance: 0, percentage: 0 },
      growth:     { balance: 0, percentage: 0 },
    };
  }

  /**
   * 30-day average spend by category for a tenant.
   */
  static async getMonthlyAvgByCategory(tenantId, category) {
    // Stub — in production, query aggregated spend data
    return 0;
  }

  /**
   * Transaction history with a specific vendor.
   */
  static async getVendorHistory(tenantId, vendorId) {
    // Stub — in production, query vendor-tagged transactions
    return { vendorId, transactionCount: 0, totalSpend: 0 };
  }

  // ── Private ────────────────────────────────────────────────────────────────

  static async _updateBucketBalances(tenantId, allocations) {
    const current = await TransactionRepository.getBucketBalances(tenantId);
    const updated = { ...current };

    for (const alloc of allocations) {
      if (!updated[alloc.bucket]) {
        updated[alloc.bucket] = { balance: 0, percentage: 0 };
      }
      updated[alloc.bucket].balance += alloc.amount;
    }

    // Recalculate percentages
    const total = Object.values(updated).reduce((s, b) => s + b.balance, 0);
    if (total > 0) {
      for (const key of Object.keys(updated)) {
        updated[key].percentage = parseFloat(((updated[key].balance / total) * 100).toFixed(2));
      }
    }

    store.bucketBalances.set(tenantId, updated);
  }
}
