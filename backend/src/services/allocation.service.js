/**
 * services/allocation.service.js
 *
 * Core allocation engine. Given a transaction, determines how to split
 * the funds across tax, operations, growth, and custom buckets.
 *
 * Logic flow:
 *   1. Load tenant's active rules (sorted by priority)
 *   2. Evaluate each rule's trigger conditions against the transaction
 *   3. Apply the first matching rule's action
 *   4. Fall back to DEFAULT_ALLOCATION if no rule matches
 *   5. Normalize percentages so they always sum to 100
 *   6. Compute exact amounts from percentages
 */

import { RulesRepository } from "../models/rules.repository.js";
import { RulesEngine } from "./rules.engine.js";
import { AppError } from "../utils/AppError.js";
import { generateId } from "../utils/generateId.js";

// Default allocation when no rules match — sensible starting point for Indian SMBs
const DEFAULT_ALLOCATION = [
  { bucket: "tax",        percentage: 18, reason: "Default GST reserve" },
  { bucket: "operations", percentage: 52, reason: "Default operational float" },
  { bucket: "growth",     percentage: 30, reason: "Default growth capital" },
];

export class AllocationService {
  /**
   * Allocate an incoming transaction.
   *
   * @param {object} params
   * @param {string} params.tenantId
   * @param {string} params.transactionId
   * @param {number} params.amount
   * @param {string} params.currency
   * @param {string} params.source
   * @param {object} [params.metadata]
   * @returns {object} Allocation decision with buckets and amounts
   */
  static async allocate({ tenantId, transactionId, amount, currency, source, metadata = {} }) {
    if (amount <= 0) {
      throw new AppError("VALIDATION_ERROR", "amount must be a positive number", 400);
    }

    // 1. Fetch all active rules for this tenant, ordered by priority ASC
    const rules = await RulesRepository.getActiveTenantRules(tenantId, "transaction.received");

    // 2. Run rules engine — returns first matching rule's action or null
    const context = { amount, currency, source, metadata };
    const matchedRule = RulesEngine.evaluate(rules, context);

    // 3. Determine bucket split
    const rawBuckets = matchedRule
      ? AllocationService._applyRuleAction(matchedRule.action)
      : DEFAULT_ALLOCATION;

    // 4. Normalize percentages to exactly 100
    const normalized = AllocationService._normalize(rawBuckets);

    // 5. Attach exact amounts
    const allocations = normalized.map((b) => ({
      ...b,
      amount: parseFloat(((b.percentage / 100) * amount).toFixed(2)),
    }));

    return {
      allocationId: generateId("alloc"),
      transactionId,
      totalAmount: amount,
      currency,
      allocations,
      ruleApplied: matchedRule?.name ?? "system_default",
      processedAt: new Date().toISOString(),
    };
  }

  /**
   * Allocate without persisting or dispatching webhooks.
   * Used by the simulation engine.
   */
  static async simulateAllocate({ amount, currency, source, metadata = {}, overrideRules = null }) {
    if (amount <= 0) throw new AppError("VALIDATION_ERROR", "amount must be positive", 400);

    const rules = overrideRules ?? [];
    const context = { amount, currency, source, metadata };
    const matchedRule = overrideRules !== null
      ? RulesEngine.evaluate(overrideRules, context)
      : null;

    const rawBuckets = matchedRule
      ? AllocationService._applyRuleAction(matchedRule.action)
      : DEFAULT_ALLOCATION;

    const normalized = AllocationService._normalize(rawBuckets);
    const allocations = normalized.map((b) => ({
      ...b,
      amount: parseFloat(((b.percentage / 100) * amount).toFixed(2)),
    }));

    return {
      simulated: true,
      allocations,
      ruleApplied: matchedRule?.name ?? "system_default",
    };
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  static _applyRuleAction(action) {
    if (action.type !== "allocate") {
      // Non-allocation actions (block, flag) fall through to default
      return DEFAULT_ALLOCATION;
    }
    return action.params.buckets.map((b) => ({
      ...b,
      reason: b.reason ?? `Rule: custom allocation`,
    }));
  }

  static _normalize(buckets) {
    const total = buckets.reduce((sum, b) => sum + b.percentage, 0);
    if (total === 0) return DEFAULT_ALLOCATION;
    return buckets.map((b) => ({
      ...b,
      percentage: parseFloat(((b.percentage / total) * 100).toFixed(4)),
    }));
  }
}
