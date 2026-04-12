/**
 * services/rules.engine.js
 *
 * Pure, stateless rule evaluator.
 *
 * Given an ordered list of rules and a transaction context object,
 * evaluates each rule's trigger conditions and returns the first match.
 *
 * This module has zero I/O — it only receives data and returns a result.
 * This makes it trivially testable and safe to use in the simulation engine.
 *
 * Supported operators:
 *   gt  — greater than
 *   lt  — less than
 *   gte — greater than or equal
 *   lte — less than or equal
 *   eq  — strict equality
 *   neq — not equal
 *   contains — string/array includes
 *   startsWith — string starts with
 */

export class RulesEngine {
  /**
   * Evaluate rules against a context and return the first matching rule.
   *
   * @param {Rule[]} rules  — sorted by priority ASC (lowest priority number = first evaluated)
   * @param {object} context — the transaction or expense data to match against
   * @returns {Rule|null} The first matched rule, or null if none match
   */
  static evaluate(rules, context) {
    const sorted = [...rules].sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));
    for (const rule of sorted) {
      if (!rule.enabled) continue;
      if (RulesEngine._matchesTrigger(rule.trigger, context)) {
        return rule;
      }
    }
    return null;
  }

  /**
   * Test all rules against a context and return all matches (for simulation/debugging).
   */
  static evaluateAll(rules, context) {
    return rules.filter(
      (r) => r.enabled && RulesEngine._matchesTrigger(r.trigger, context)
    );
  }

  // ── Private ────────────────────────────────────────────────────────────────

  static _matchesTrigger(trigger, context) {
    if (!trigger?.conditions?.length) return true; // No conditions = always matches
    return trigger.conditions.every((cond) =>
      RulesEngine._evaluateCondition(cond, context)
    );
  }

  static _evaluateCondition({ field, operator, value }, context) {
    // Support nested field access: "metadata.clientId"
    const actual = field.split(".").reduce((obj, key) => obj?.[key], context);
    if (actual === undefined) return false;

    switch (operator) {
      case "gt": return actual > value;
      case "lt": return actual < value;
      case "gte": return actual >= value;
      case "lte": return actual <= value;
      case "eq": return actual === value;
      case "neq": return actual !== value;
      case "contains":
        if (Array.isArray(actual)) return actual.includes(value);
        if (typeof actual === "string") return actual.includes(value);
        return false;
      case "startsWith":
        return typeof actual === "string" && actual.startsWith(value);
      default:
        console.warn(`RulesEngine: unknown operator "${operator}" — condition skipped`);
        return false;
    }
  }
}
