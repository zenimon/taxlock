/**
 * tests/unit/rules.engine.test.js
 *
 * Unit tests for the RulesEngine — the most critical piece of logic
 * in the whole system. Pure function, no I/O, fast to run.
 */

import { RulesEngine } from "../../src/services/rules.engine.js";

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeRule(overrides = {}) {
  return {
    id: "rule_test",
    name: "Test rule",
    enabled: true,
    priority: 10,
    trigger: {
      event: "transaction.received",
      conditions: [],
    },
    action: { type: "allocate", params: {} },
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("RulesEngine.evaluate", () => {
  test("returns null when no rules provided", () => {
    expect(RulesEngine.evaluate([], { amount: 1000 })).toBeNull();
  });

  test("returns null when all rules are disabled", () => {
    const rule = makeRule({ enabled: false });
    expect(RulesEngine.evaluate([rule], { amount: 1000 })).toBeNull();
  });

  test("matches a rule with no conditions (catch-all)", () => {
    const rule = makeRule();
    expect(RulesEngine.evaluate([rule], { amount: 1000 })).toEqual(rule);
  });

  test("evaluates gt operator correctly", () => {
    const rule = makeRule({
      trigger: {
        event: "transaction.received",
        conditions: [{ field: "amount", operator: "gt", value: 10000 }],
      },
    });
    expect(RulesEngine.evaluate([rule], { amount: 5000 })).toBeNull();
    expect(RulesEngine.evaluate([rule], { amount: 10001 })).toEqual(rule);
    expect(RulesEngine.evaluate([rule], { amount: 10000 })).toBeNull(); // not gt, only gte
  });

  test("evaluates gte operator correctly", () => {
    const rule = makeRule({
      trigger: {
        event: "transaction.received",
        conditions: [{ field: "amount", operator: "gte", value: 10000 }],
      },
    });
    expect(RulesEngine.evaluate([rule], { amount: 10000 })).toEqual(rule);
    expect(RulesEngine.evaluate([rule], { amount: 9999 })).toBeNull();
  });

  test("evaluates eq operator correctly", () => {
    const rule = makeRule({
      trigger: {
        event: "transaction.received",
        conditions: [{ field: "source", operator: "eq", value: "invoice" }],
      },
    });
    expect(RulesEngine.evaluate([rule], { source: "invoice" })).toEqual(rule);
    expect(RulesEngine.evaluate([rule], { source: "transfer" })).toBeNull();
  });

  test("evaluates contains on array", () => {
    const rule = makeRule({
      trigger: {
        event: "transaction.received",
        conditions: [{ field: "tags", operator: "contains", value: "gst" }],
      },
    });
    expect(RulesEngine.evaluate([rule], { tags: ["gst", "invoice"] })).toEqual(rule);
    expect(RulesEngine.evaluate([rule], { tags: ["payroll"] })).toBeNull();
  });

  test("evaluates nested field access via dot notation", () => {
    const rule = makeRule({
      trigger: {
        event: "transaction.received",
        conditions: [{ field: "metadata.clientId", operator: "eq", value: "client_007" }],
      },
    });
    expect(RulesEngine.evaluate([rule], { metadata: { clientId: "client_007" } })).toEqual(rule);
    expect(RulesEngine.evaluate([rule], { metadata: { clientId: "other" } })).toBeNull();
  });

  test("returns first match when multiple rules exist (priority order)", () => {
    const lowPriority  = makeRule({ id: "rule_low",  priority: 20, name: "Low priority" });
    const highPriority = makeRule({ id: "rule_high", priority: 5,  name: "High priority" });
    const result = RulesEngine.evaluate([lowPriority, highPriority], { amount: 1000 });
    // Should match high priority first (lower number = higher priority)
    expect(result.id).toBe("rule_high");
  });

  test("ALL conditions must pass (AND logic)", () => {
    const rule = makeRule({
      trigger: {
        event: "transaction.received",
        conditions: [
          { field: "amount", operator: "gte", value: 10000 },
          { field: "source", operator: "eq", value: "invoice" },
        ],
      },
    });
    // Both pass
    expect(RulesEngine.evaluate([rule], { amount: 50000, source: "invoice" })).toEqual(rule);
    // Only one passes
    expect(RulesEngine.evaluate([rule], { amount: 50000, source: "transfer" })).toBeNull();
    expect(RulesEngine.evaluate([rule], { amount: 5000, source: "invoice" })).toBeNull();
  });

  test("returns null for unknown field (field not in context)", () => {
    const rule = makeRule({
      trigger: {
        event: "transaction.received",
        conditions: [{ field: "nonexistent", operator: "eq", value: "anything" }],
      },
    });
    expect(RulesEngine.evaluate([rule], { amount: 1000 })).toBeNull();
  });
});

describe("RulesEngine.evaluateAll", () => {
  test("returns all matching rules, not just the first", () => {
    const rule1 = makeRule({ id: "r1", priority: 5 });
    const rule2 = makeRule({ id: "r2", priority: 10 });
    const rule3 = makeRule({ id: "r3", enabled: false });
    const result = RulesEngine.evaluateAll([rule1, rule2, rule3], { amount: 1000 });
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.id)).toEqual(["r1", "r2"]);
  });
});
