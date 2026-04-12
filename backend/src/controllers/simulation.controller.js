/**
 * controllers/simulation.controller.js
 *
 * Handles HTTP for all simulation endpoints.
 * All methods return { simulated: true } — nothing is persisted.
 */

import { AllocationService } from "../services/allocation.service.js";
import { CashflowEngine } from "../simulation/cashflow.engine.js";
import { RulesEngine } from "../services/rules.engine.js";

export class SimulationController {
  /**
   * POST /simulate/allocation
   * Dry-run a single transaction allocation.
   */
  static async allocation(req, res, next) {
    try {
      const { amount, currency, source, metadata, overrideRules } = req.body;

      const result = await AllocationService.simulateAllocate({
        amount,
        currency,
        source,
        metadata,
        overrideRules: overrideRules ?? null,
      });

      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /simulate/cashflow
   * Multi-period cashflow projection.
   */
  static async cashflow(req, res, next) {
    try {
      const {
        periods,
        periodUnit,
        initialBalances,
        projectedInflows,
        projectedOutflows,
        scenarios,
        rules,
      } = req.body;

      const result = await CashflowEngine.project({
        periods,
        periodUnit,
        initialBalances,
        projectedInflows,
        projectedOutflows,
        scenarios: scenarios ?? ["base"],
        rules: rules ?? [],
      });

      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /simulate/rule-test
   * Test a rule definition against a batch of sample transactions.
   */
  static async ruleTest(req, res, next) {
    try {
      const { rule, sampleTransactions } = req.body;

      const results = sampleTransactions.map((txn) => {
        const matched = RulesEngine.evaluate([{ ...rule, enabled: true, priority: 0 }], txn);
        return {
          transaction: txn,
          matched: matched !== null,
          actionFired: matched ? matched.action.type : null,
        };
      });

      const matched = results.filter((r) => r.matched).length;

      return res.status(200).json({
        simulated: true,
        matched,
        unmatched: sampleTransactions.length - matched,
        matchRate: `${((matched / sampleTransactions.length) * 100).toFixed(1)}%`,
        results,
      });
    } catch (err) {
      next(err);
    }
  }
}
