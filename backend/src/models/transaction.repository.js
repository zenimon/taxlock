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

import { TransactionModel, IdempotencyModel, BalancesModel } from "./schemas/transaction.model.js";
import { generateId } from "../utils/generateId.js";

export class TransactionRepository {
  static async saveAllocation(tenantId, allocation, idempotencyKey = null) {
    const record = await TransactionModel.create({ ...allocation, tenantId });

    if (idempotencyKey) {
      await IdempotencyModel.create({
        key: `${tenantId}:${idempotencyKey}`,
        allocationId: allocation.allocationId
      });
    }

    // Update bucket balances
    await TransactionRepository._updateBucketBalances(tenantId, allocation.allocations);

    return record.toObject();
  }

  static async findByIdempotencyKey(tenantId, key) {
    const entry = await IdempotencyModel.findOne({ key: `${tenantId}:${key}` });
    if (!entry) return null;
    return await TransactionModel.findOne({ allocationId: entry.allocationId }).lean();
  }

  /**
   * Paginated list of allocations for a tenant.
   */
  static async listAllocations(tenantId, { page, limit, from, to, bucket }) {
    const query = { tenantId };
    if (from || to) {
      query.processedAt = {};
      if (from) query.processedAt.$gte = new Date(from);
      if (to) query.processedAt.$lte = new Date(to);
    }
    if (bucket) {
      query.allocations = { $elemMatch: { bucket } };
    }

    const total = await TransactionModel.countDocuments(query);
    const records = await TransactionModel.find(query)
      .sort({ processedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const data = records.map(r => ({
      ...r,
      id: r.allocationId,
      timestamp: r.processedAt
    }));

    return {
      transactions: data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Current bucket balances for a tenant.
   */
  static async getBucketBalances(tenantId) {
    const entry = await BalancesModel.findOne({ tenantId }).lean();
    return entry?.balances ?? {
      tax: { balance: 0, percentage: 0 },
      operations: { balance: 0, percentage: 0 },
      growth: { balance: 0, percentage: 0 },
    };
  }

  static async _updateBucketBalances(tenantId, allocations) {
    const current = await TransactionRepository.getBucketBalances(tenantId);
    const updated = { ...current };

    for (const alloc of allocations) {
      if (!updated[alloc.bucket]) {
        updated[alloc.bucket] = { balance: 0, percentage: 0 };
      }
      updated[alloc.bucket].balance += alloc.amount;
    }

    const total = Object.values(updated).reduce((s, b) => s + b.balance, 0);
    if (total > 0) {
      for (const key of Object.keys(updated)) {
        updated[key].percentage = parseFloat(((updated[key].balance / total) * 100).toFixed(2));
      }
    }

    await BalancesModel.findOneAndUpdate(
      { tenantId },
      { $set: { balances: updated, updatedAt: new Date() } },
      { upsert: true }
    );
  }

  /**
   * Reset the in-memory store (Dev/Test only).
   */
  static async clear() {
    await TransactionModel.deleteMany({});
    await IdempotencyModel.deleteMany({});
    await BalancesModel.deleteMany({});
  }
}
