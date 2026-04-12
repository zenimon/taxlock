/**
 * controllers/rules.controller.js
 *
 * CRUD for tenant allocation and risk rules.
 */

import { RulesRepository } from "../models/rules.repository.js";
import { AppError } from "../utils/AppError.js";

export class RulesController {
  static async list(req, res, next) {
    try {
      const rules = await RulesRepository.listByTenant(req.tenant.id);
      return res.json({ data: rules, total: rules.length });
    } catch (err) { next(err); }
  }

  static async create(req, res, next) {
    try {
      const rule = await RulesRepository.create(req.tenant.id, req.body);
      return res.status(201).json(rule);
    } catch (err) { next(err); }
  }

  static async get(req, res, next) {
    try {
      const rule = await RulesRepository.findById(req.tenant.id, req.params.ruleId);
      if (!rule) throw new AppError("NOT_FOUND", "Rule not found", 404);
      return res.json(rule);
    } catch (err) { next(err); }
  }

  static async update(req, res, next) {
    try {
      const rule = await RulesRepository.update(req.tenant.id, req.params.ruleId, req.body);
      if (!rule) throw new AppError("NOT_FOUND", "Rule not found", 404);
      return res.json(rule);
    } catch (err) { next(err); }
  }

  static async remove(req, res, next) {
    try {
      const deleted = await RulesRepository.remove(req.tenant.id, req.params.ruleId);
      if (!deleted) throw new AppError("NOT_FOUND", "Rule not found", 404);
      return res.status(204).send();
    } catch (err) { next(err); }
  }
}
