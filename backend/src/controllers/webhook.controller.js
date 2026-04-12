/**
 * controllers/webhook.controller.js
 */

import { WebhookRepository } from "../models/webhook.repository.js";
import { AppError } from "../utils/AppError.js";
import crypto from "crypto";

export class WebhookController {
  static async list(req, res, next) {
    try {
      const webhooks = await WebhookRepository.listByTenant(req.tenant.id);
      return res.json({ data: webhooks });
    } catch (err) { next(err); }
  }

  static async create(req, res, next) {
    try {
      const { url, events } = req.body;
      // Generate a signing secret — shown once, never stored in plain text after this
      const secret = crypto.randomBytes(32).toString("hex");
      const webhook = await WebhookRepository.create(req.tenant.id, { url, events, secret });
      return res.status(201).json({ ...webhook, secret }); // Include secret in creation response only
    } catch (err) { next(err); }
  }

  static async remove(req, res, next) {
    try {
      const deleted = await WebhookRepository.remove(req.tenant.id, req.params.webhookId);
      if (!deleted) throw new AppError("NOT_FOUND", "Webhook not found", 404);
      return res.status(204).send();
    } catch (err) { next(err); }
  }

  static async deliveries(req, res, next) {
    try {
      const { webhookId } = req.params;
      const { status } = req.query;
      const deliveries = await WebhookRepository.getDeliveries(req.tenant.id, webhookId, { status });
      return res.json({ data: deliveries });
    } catch (err) { next(err); }
  }
}
