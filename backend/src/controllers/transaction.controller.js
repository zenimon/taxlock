/**
 * controllers/transaction.controller.js
 *
 * Handles HTTP concerns for transaction endpoints:
 * - Validates and extracts request data
 * - Delegates business logic to the AllocationService and RiskService
 * - Formats and returns responses
 *
 * No business logic lives here — controllers are thin wrappers.
 */

import { AllocationService } from "../services/allocation.service.js";
import { RiskService } from "../services/risk.service.js";
import { WebhookService } from "../services/webhook.service.js";
import { TransactionRepository } from "../models/transaction.repository.js";
import { AppError } from "../utils/AppError.js";

export class TransactionController {
  /**
   * POST /transaction/allocate
   *
   * Receives an incoming transaction and returns a full allocation decision.
   * If an idempotency key is provided, a cached response is returned for
   * duplicate requests — safe for retries.
   */
  static async allocate(req, res, next) {
    try {
      const { transactionId, amount, currency, source, metadata } = req.body;
      const tenantId = req.tenant.id;
      const idempotencyKey = req.headers["x-idempotency-key"];

      // Idempotency check — return cached result if this key was seen before
      if (idempotencyKey) {
        const cached = await TransactionRepository.findByIdempotencyKey(tenantId, idempotencyKey);
        if (cached) return res.json(cached);
      }

      const result = await AllocationService.allocate({
        tenantId,
        transactionId,
        amount,
        currency,
        source,
        metadata,
      });

      // Persist the allocation record
      const saved = await TransactionRepository.saveAllocation(tenantId, result, idempotencyKey);

      // Fire webhook event async — don't await, don't let failures block the response
      WebhookService.dispatch(tenantId, "transaction.allocated", saved).catch(console.error);

      return res.status(200).json(saved);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /transaction/assess
   *
   * Pre-spend risk check. Returns a risk score, level, and recommendation
   * before the business commits to a payment.
   */
  static async assess(req, res, next) {
    try {
      const { amount, currency, category, vendorId, metadata } = req.body;
      const tenantId = req.tenant.id;

      const assessment = await RiskService.assess({
        tenantId,
        amount,
        currency,
        category,
        vendorId,
        metadata,
      });

      // Fire risk.flagged webhook only if risk is elevated
      if (assessment.risk.level !== "low") {
        WebhookService.dispatch(tenantId, "risk.flagged", assessment).catch(console.error);
      }

      return res.status(200).json(assessment);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /transaction/history
   *
   * Returns paginated allocation history for the tenant.
   */
  static async history(req, res, next) {
    try {
      const tenantId = req.tenant.id;
      const { page = 1, limit = 20, from, to, bucket } = req.query;

      const result = await TransactionRepository.listAllocations(tenantId, {
        page: parseInt(page),
        limit: Math.min(parseInt(limit), 100),
        from,
        to,
        bucket,
      });

      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}
