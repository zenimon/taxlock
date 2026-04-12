/**
 * services/risk.service.js
 *
 * Risk assessment engine. Evaluates a proposed expense against historical
 * patterns, current bucket balances, and tenant-defined risk rules.
 *
 * Scoring model:
 *   Each risk factor contributes a weighted score in [0, 1].
 *   Final score = sum of (factor.raw * factor.weight), clamped to [0, 1].
 *
 * Risk levels:
 *   0.00 – 0.39  → low      (auto-approve)
 *   0.40 – 0.74  → medium   (surface to business owner)
 *   0.75 – 0.89  → high     (require explicit approval)
 *   0.90 – 1.00  → critical (auto-block)
 */

import { TransactionRepository } from "../models/transaction.repository.js";
import { RulesRepository } from "../models/rules.repository.js";
import { RulesEngine } from "./rules.engine.js";
import { generateId } from "../utils/generateId.js";
import { config } from "../../config/env.js";

export class RiskService {
  /**
   * Assess risk for a proposed outbound transaction.
   *
   * @param {object} params
   * @param {string} params.tenantId
   * @param {number} params.amount
   * @param {string} params.currency
   * @param {string} params.category  — payroll | vendor | rent | software | marketing | capex | other
   * @param {string} [params.vendorId]
   * @param {object} [params.metadata]
   */
  static async assess({ tenantId, amount, currency, category, vendorId, metadata = {} }) {
    // Gather historical context for this tenant
    const [monthlyAvg, bucketBalances, recentVendorHistory] = await Promise.all([
      TransactionRepository.getMonthlyAvgByCategory(tenantId, category),
      TransactionRepository.getBucketBalances(tenantId),
      vendorId
        ? TransactionRepository.getVendorHistory(tenantId, vendorId)
        : Promise.resolve(null),
    ]);

    // Evaluate individual risk factors
    const factors = RiskService._computeFactors({
      amount,
      category,
      monthlyAvg,
      bucketBalances,
      recentVendorHistory,
    });

    const score = RiskService._computeScore(factors);
    const level = RiskService._scoreToLevel(score);
    const recommendation = RiskService._levelToRecommendation(level);

    // Check tenant risk rules (may override the computed recommendation)
    const rules = await RulesRepository.getActiveTenantRules(tenantId, "expense.requested");
    const context = { amount, currency, category, vendorId, metadata, riskScore: score };
    const matchedRule = RulesEngine.evaluate(rules, context);

    const finalRecommendation = matchedRule?.action.type === "block"
      ? "block"
      : matchedRule?.action.type === "flag"
        ? "review"
        : recommendation;

    return {
      assessmentId: generateId("asmt"),
      recommendation: finalRecommendation,
      risk: { score: parseFloat(score.toFixed(4)), level, factors },
      currentBucketBalances: bucketBalances,
      ruleApplied: matchedRule?.name ?? null,
      assessedAt: new Date().toISOString(),
    };
  }

  // ── Factor computation ─────────────────────────────────────────────────────

  static _computeFactors({ amount, category, monthlyAvg, bucketBalances, recentVendorHistory }) {
    const factors = [];

    // Factor 1: Large single expense relative to monthly average
    if (monthlyAvg > 0) {
      const ratio = amount / monthlyAvg;
      if (ratio > 0.4) {
        factors.push({
          factor: "large_single_expense",
          weight: Math.min(ratio * 0.3, 0.4),
          description: `Expense is ${(ratio * 100).toFixed(0)}% of monthly average for ${category}`,
        });
      }
    }

    // Factor 2: Low operations bucket balance after this expense
    const opsBalance = bucketBalances?.operations?.balance ?? 0;
    const postExpenseBalance = opsBalance - amount;
    if (postExpenseBalance < 0) {
      factors.push({
        factor: "insufficient_ops_balance",
        weight: 0.5,
        description: `Expense exceeds operations bucket balance by ₹${Math.abs(postExpenseBalance).toLocaleString()}`,
      });
    } else if (opsBalance > 0 && (postExpenseBalance / opsBalance) < 0.3) {
      factors.push({
        factor: "low_ops_balance",
        weight: 0.3,
        description: `Operations bucket will fall to ${((postExpenseBalance / opsBalance) * 100).toFixed(0)}% — below 30% safety threshold`,
      });
    }

    // Factor 3: New vendor with no history
    if (recentVendorHistory !== null && recentVendorHistory.transactionCount === 0) {
      factors.push({
        factor: "new_vendor",
        weight: 0.2,
        description: "No prior transactions with this vendor",
      });
    }

    // Factor 4: Unusual category for this business
    if (monthlyAvg === 0 && category !== "other") {
      factors.push({
        factor: "unusual_category",
        weight: 0.15,
        description: `No prior spending in ${category} category`,
      });
    }

    return factors;
  }

  static _computeScore(factors) {
    const raw = factors.reduce((sum, f) => sum + f.weight, 0);
    return Math.min(raw, 1);
  }

  static _scoreToLevel(score) {
    if (score >= 0.9) return "critical";
    if (score >= config.DEFAULT_RISK_HIGH_THRESHOLD) return "high";
    if (score >= config.DEFAULT_RISK_MEDIUM_THRESHOLD) return "medium";
    return "low";
  }

  static _levelToRecommendation(level) {
    if (level === "critical") return "block";
    if (level === "high") return "review";
    if (level === "medium") return "review";
    return "approve";
  }
}
