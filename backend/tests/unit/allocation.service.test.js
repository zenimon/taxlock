/**
 * tests/unit/allocation.service.test.js
 *
 * Tests for the AllocationService — focuses on percentage normalization,
 * default fallback, and amount calculation correctness.
 */

import { jest } from "@jest/globals";
import { AllocationService } from "../../src/services/allocation.service.js";

// Mock the RulesRepository so tests run without a DB
jest.mock("../../src/models/rules.repository.js", () => ({
  RulesRepository: {
    getActiveTenantRules: jest.fn().mockResolvedValue([]),
  },
}));

describe("AllocationService.simulateAllocate", () => {
  test("uses system default when no rules provided", async () => {
    const result = await AllocationService.simulateAllocate({
      amount: 100000,
      currency: "INR",
      source: "invoice",
      overrideRules: [],
    });

    expect(result.simulated).toBe(true);
    expect(result.ruleApplied).toBe("system_default");
    expect(result.allocations).toHaveLength(3);

    const buckets = Object.fromEntries(result.allocations.map((a) => [a.bucket, a]));
    expect(buckets.tax.percentage).toBeCloseTo(18, 1);
    expect(buckets.operations.percentage).toBeCloseTo(52, 1);
    expect(buckets.growth.percentage).toBeCloseTo(30, 1);
  });

  test("amounts sum exactly to total", async () => {
    const amount = 125000;
    const result = await AllocationService.simulateAllocate({
      amount,
      currency: "INR",
      source: "invoice",
      overrideRules: [],
    });

    const total = result.allocations.reduce((s, a) => s + a.amount, 0);
    // Allow for floating point rounding (±1 rupee)
    expect(Math.abs(total - amount)).toBeLessThan(1);
  });

  test("applies override rules when provided", async () => {
    const overrideRules = [{
      id: "test_rule",
      name: "Heavy tax rule",
      enabled: true,
      priority: 1,
      trigger: {
        event: "transaction.received",
        conditions: [],
      },
      action: {
        type: "allocate",
        params: {
          buckets: [
            { bucket: "tax", percentage: 30 },
            { bucket: "operations", percentage: 70 },
          ],
        },
      },
    }];

    const result = await AllocationService.simulateAllocate({
      amount: 100000,
      currency: "INR",
      source: "invoice",
      overrideRules,
    });

    const buckets = Object.fromEntries(result.allocations.map((a) => [a.bucket, a]));
    expect(buckets.tax.percentage).toBeCloseTo(30, 1);
    expect(buckets.operations.percentage).toBeCloseTo(70, 1);
    expect(result.ruleApplied).toBe("Heavy tax rule");
  });

  test("throws on non-positive amount", async () => {
    await expect(
      AllocationService.simulateAllocate({ amount: -500, currency: "INR", source: "invoice" })
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });

    await expect(
      AllocationService.simulateAllocate({ amount: 0, currency: "INR", source: "invoice" })
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
  });

  test("normalizes percentages that don't sum to 100", async () => {
    const overrideRules = [{
      id: "unbalanced_rule",
      name: "Unbalanced",
      enabled: true,
      priority: 1,
      trigger: { event: "transaction.received", conditions: [] },
      action: {
        type: "allocate",
        params: {
          buckets: [
            { bucket: "tax", percentage: 10 },
            { bucket: "operations", percentage: 30 },
            // Total = 40, not 100 — should be normalized to 25% / 75%
          ],
        },
      },
    }];

    const result = await AllocationService.simulateAllocate({
      amount: 100000,
      currency: "INR",
      source: "invoice",
      overrideRules,
    });

    const totalPct = result.allocations.reduce((s, a) => s + a.percentage, 0);
    expect(totalPct).toBeCloseTo(100, 1);
  });
});
