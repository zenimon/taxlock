/**
 * models/rules.repository.js
 *
 * Data access layer for tenant rules.
 * In-memory store for dev/test — swap internals for Postgres without
 * touching any service or controller code.
 */

import { generateId } from "../utils/generateId.js";

const store = new Map(); // key: tenantId → Rule[]

export class RulesRepository {
  static async listByTenant(tenantId) {
    return (store.get(tenantId) ?? []).sort((a, b) => a.priority - b.priority);
  }

  static async getActiveTenantRules(tenantId, event) {
    const rules = store.get(tenantId) ?? [];
    return rules
      .filter((r) => r.enabled && r.trigger.event === event)
      .sort((a, b) => a.priority - b.priority);
  }

  static async findById(tenantId, ruleId) {
    return (store.get(tenantId) ?? []).find((r) => r.id === ruleId) ?? null;
  }

  static async create(tenantId, data) {
    const rules = store.get(tenantId) ?? [];
    const rule = {
      id: generateId("rule"),
      ...data,
      priority: data.priority ?? 100,
      enabled: data.enabled ?? true,
      createdAt: new Date().toISOString(),
    };
    rules.push(rule);
    store.set(tenantId, rules);
    return rule;
  }

  static async update(tenantId, ruleId, data) {
    const rules = store.get(tenantId) ?? [];
    const idx = rules.findIndex((r) => r.id === ruleId);
    if (idx === -1) return null;
    rules[idx] = { ...rules[idx], ...data, id: ruleId };
    store.set(tenantId, rules);
    return rules[idx];
  }

  static async remove(tenantId, ruleId) {
    const rules = store.get(tenantId) ?? [];
    const idx = rules.findIndex((r) => r.id === ruleId);
    if (idx === -1) return false;
    rules.splice(idx, 1);
    store.set(tenantId, rules);
    return true;
  }
}
