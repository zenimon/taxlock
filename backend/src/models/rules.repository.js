/**
 * models/rules.repository.js
 *
 * Data access layer for tenant rules.
 * In-memory store for dev/test — swap internals for Postgres without
 * touching any service or controller code.
 */

import { RuleModel } from "./schemas/rule.model.js";
import { generateId } from "../utils/generateId.js";

export class RulesRepository {
  static async listByTenant(tenantId) {
    return await RuleModel.find({ tenantId }).sort({ priority: 1 }).lean();
  }

  static async getActiveTenantRules(tenantId, event) {
    return await RuleModel.find({
      tenantId,
      enabled: true,
      $or: [{ "trigger.event": event }, { triggerEvent: event }]
    }).sort({ priority: 1 }).lean();
  }

  static async findById(tenantId, ruleId) {
    return await RuleModel.findOne({ tenantId, id: ruleId }).lean();
  }

  static async create(tenantId, data) {
    const id = generateId("rule");
    const rule = await RuleModel.create({
      id,
      tenantId,
      ...data,
      priority: data.priority ?? 100,
      enabled: data.enabled ?? true,
    });
    return rule.toObject();
  }

  static async update(tenantId, ruleId, data) {
    return await RuleModel.findOneAndUpdate(
      { tenantId, id: ruleId },
      { $set: data },
      { new: true }
    ).lean();
  }

  static async remove(tenantId, ruleId) {
    const res = await RuleModel.deleteOne({ tenantId, id: ruleId });
    return res.deletedCount > 0;
  }

  static async clear() {
    await RuleModel.deleteMany({});
  }
}
