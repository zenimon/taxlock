/**
 * utils/seedData.js
 *
 * Generates realistic "startup" seed data for development and testing.
 * Includes revenue from SaaS subscriptions and common expenses like
 * cloud infrastructure, payroll, and marketing.
 */

import { RulesRepository } from "../models/rules.repository.js";
import { TransactionRepository } from "../models/transaction.repository.js";
import { generateId } from "./generateId.js";

export async function seedAll(tenantId = "tenant_dev_001") {
    console.log(`Seeding data for tenant: ${tenantId}...`);

    // 1. Clear existing data
    await RulesRepository.clear();
    await TransactionRepository.clear();

    // 2. Seed Default Rules
    const startupRules = [
        {
            name: "GST Reserve (India)",
            triggerEvent: "allocate",
            actionType: "allocate",
            actionParams: { tax: 18, operations: 52, growth: 30 },
            trigger: { event: "transaction.received", conditions: [{ field: "currency", operator: "eq", value: "INR" }] },
            priority: 10,
            enabled: true,
        },
        {
            name: "TDS Reserve (India)",
            triggerEvent: "allocate",
            actionType: "allocate",
            actionParams: { tax: 10, operations: 60, growth: 30 },
            trigger: { event: "transaction.received", conditions: [{ field: "category", operator: "eq", value: "service" }] },
            priority: 20,
            enabled: true,
        },
        {
            name: "Growth Fund",
            triggerEvent: "allocate",
            actionType: "allocate",
            actionParams: { tax: 0, operations: 70, growth: 30 },
            trigger: { event: "transaction.received", conditions: [] },
            priority: 30,
            enabled: true,
        },
        {
            name: "Operations Fund",
            triggerEvent: "allocate",
            actionType: "allocate",
            actionParams: { tax: 0, operations: 100, growth: 0 },
            trigger: { event: "transaction.received", conditions: [] },
            priority: 100,
            enabled: true,
        },
    ];

    for (const rule of startupRules) {
        await RulesRepository.create(tenantId, rule);
    }

    // 3. Seed Realistic Transactions (Last 3 months)
    const transactions = [];
    const now = new Date();

    // Inflows: SaaS Subscriptions
    for (let i = 1; i <= 30; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - (i * 3)); // Every 3 days

        transactions.push({
            allocationId: generateId("alloc"),
            amount: 15000 + Math.random() * 5000,
            currency: "INR",
            source: "subscription",
            processedAt: date.toISOString(),
            allocations: [
                { bucket: "tax", percentage: 18, amount: 2700 }, // ~18%
                { bucket: "growth", percentage: 20, amount: 3000 }, // 20%
                { bucket: "operations", percentage: 62, amount: 9300 },
            ],
        });
    }

    // Outflows: AWS (Once a month)
    for (let i = 0; i < 3; i++) {
        const date = new Date(now);
        date.setMonth(date.getMonth() - i);
        date.setDate(1);

        await TransactionRepository.saveAllocation(tenantId, {
            allocationId: generateId("alloc"),
            amount: -45000, // AWS Bill
            currency: "INR",
            source: "other",
            processedAt: date.toISOString(),
            allocations: [{ bucket: "operations", percentage: 100, amount: -45000 }],
        });
    }

    // Outflows: Payroll (Once a month)
    for (let i = 0; i < 3; i++) {
        const date = new Date(now);
        date.setMonth(date.getMonth() - i);
        date.setDate(28);

        await TransactionRepository.saveAllocation(tenantId, {
            allocationId: generateId("alloc"),
            amount: -250000, // Team Payroll
            currency: "INR",
            source: "other",
            processedAt: date.toISOString(),
            allocations: [{ bucket: "operations", percentage: 100, amount: -250000 }],
        });
    }

    // Save all inflows
    for (const tx of transactions) {
        await TransactionRepository.saveAllocation(tenantId, tx);
    }

    console.log("Seeding complete.");
    return { success: true, rulesCount: startupRules.length, transactionsCount: transactions.length + 6 };
}
