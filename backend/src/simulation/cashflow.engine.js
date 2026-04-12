/**
 * simulation/cashflow.engine.js
 *
 * Projects bucket balances forward through N periods given expected
 * inflows and outflows. Supports multiple scenarios (base, downside, upside).
 *
 * Each period:
 *   1. Apply inflows → run through AllocationService.simulateAllocate
 *   2. Apply outflows → deduct from the relevant bucket
 *   3. Record bucket snapshots
 *   4. Detect risk events (bucket negative, tax reserve below legal floor, etc.)
 *
 * Returns a timeline array (one entry per period) and a summary.
 */

import { AllocationService } from "../services/allocation.service.js";
import { config } from "../../config/env.js";

const SCENARIO_MULTIPLIERS = {
  base:         { inflow: 1.0, outflow: 1.0 },
  upside_20pct: { inflow: 1.2, outflow: 1.0 },
  downside_20pct: { inflow: 0.8, outflow: 1.0 },
  downside_40pct: { inflow: 0.6, outflow: 1.1 },
};

export class CashflowEngine {
  /**
   * Project cashflow.
   *
   * @param {object} params
   * @param {number} params.periods
   * @param {string} params.periodUnit — "month" | "quarter"
   * @param {object} params.initialBalances — { tax, operations, growth, ... }
   * @param {object[]} params.projectedInflows
   * @param {object[]} params.projectedOutflows
   * @param {string[]} params.scenarios — subset of SCENARIO_MULTIPLIERS keys
   * @param {Rule[]} [params.rules] — optional tenant rules for allocation
   */
  static async project({
    periods,
    periodUnit = "month",
    initialBalances = {},
    projectedInflows = [],
    projectedOutflows = [],
    scenarios = ["base"],
    rules = [],
  }) {
    const maxPeriods = Math.min(periods, config.SIMULATION_MAX_PERIODS);
    const results = {};

    for (const scenario of scenarios) {
      const multiplier = SCENARIO_MULTIPLIERS[scenario] ?? SCENARIO_MULTIPLIERS.base;
      results[scenario] = await CashflowEngine._runScenario({
        periods: maxPeriods,
        periodUnit,
        initialBalances: { ...initialBalances },
        projectedInflows,
        projectedOutflows,
        multiplier,
        rules,
      });
    }

    return {
      simulated: true,
      periods: maxPeriods,
      periodUnit,
      scenarios: results,
      summary: CashflowEngine._summarize(results),
    };
  }

  // ── Private ────────────────────────────────────────────────────────────────

  static async _runScenario({
    periods, periodUnit, initialBalances, projectedInflows,
    projectedOutflows, multiplier, rules,
  }) {
    const balances = { ...initialBalances };
    const timeline = [];
    const riskEvents = [];

    for (let p = 1; p <= periods; p++) {
      const periodLabel = CashflowEngine._periodLabel(p, periodUnit);

      // Apply inflows
      let totalInflow = 0;
      for (const inflow of projectedInflows) {
        if (!CashflowEngine._isActive(inflow, p)) continue;
        const scaledAmount = inflow.amount * multiplier.inflow;
        totalInflow += scaledAmount;

        // Run through allocation engine (dry-run)
        const alloc = await AllocationService.simulateAllocate({
          amount: scaledAmount,
          currency: inflow.currency ?? "INR",
          source: inflow.source ?? "other",
          overrideRules: rules,
        });

        for (const bucket of alloc.allocations) {
          balances[bucket.bucket] = (balances[bucket.bucket] ?? 0) + bucket.amount;
        }
      }

      // Apply outflows
      let totalOutflow = 0;
      for (const outflow of projectedOutflows) {
        if (!CashflowEngine._isActive(outflow, p)) continue;
        const scaledAmount = outflow.amount * multiplier.outflow;
        totalOutflow += scaledAmount;

        const targetBucket = outflow.bucket ?? "operations";
        balances[targetBucket] = (balances[targetBucket] ?? 0) - scaledAmount;

        // Risk event: bucket gone negative
        if (balances[targetBucket] < 0) {
          riskEvents.push({
            period: periodLabel,
            type: "bucket_negative",
            bucket: targetBucket,
            deficit: Math.abs(balances[targetBucket]),
          });
        }
      }

      // Risk event: tax reserve critically low (below 50% of expected)
      const expectedTax = totalInflow * 0.18;
      if ((balances.tax ?? 0) < expectedTax * 0.5) {
        riskEvents.push({
          period: periodLabel,
          type: "tax_reserve_low",
          current: balances.tax ?? 0,
          expected: expectedTax,
        });
      }

      timeline.push({
        period: periodLabel,
        inflow: parseFloat(totalInflow.toFixed(2)),
        outflow: parseFloat(totalOutflow.toFixed(2)),
        net: parseFloat((totalInflow - totalOutflow).toFixed(2)),
        balances: Object.fromEntries(
          Object.entries(balances).map(([k, v]) => [k, parseFloat((v ?? 0).toFixed(2))])
        ),
      });
    }

    return { timeline, riskEvents };
  }

  static _isActive(flow, period) {
    if (flow.frequency === "once") return period === (flow.period ?? 1);
    if (flow.frequency === "monthly") return true;
    if (flow.frequency === "quarterly") return period % 3 === 1;
    if (flow.frequency === "annual") return period % 12 === 1;
    return true;
  }

  static _periodLabel(p, unit) {
    if (unit === "quarter") return `Q${p}`;
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return months[(p - 1) % 12];
  }

  static _summarize(results) {
    const summary = {};
    for (const [scenario, data] of Object.entries(results)) {
      const allBalances = data.timeline.map((t) => t.balances);
      const lowestBalance = {};
      for (const key of Object.keys(allBalances[0] ?? {})) {
        lowestBalance[key] = Math.min(...allBalances.map((b) => b[key] ?? 0));
      }
      summary[scenario] = {
        riskEventCount: data.riskEvents.length,
        lowestBalance,
        riskEvents: data.riskEvents,
      };
    }
    return summary;
  }
}
