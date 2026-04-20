/**
 * models/webhook.repository.js
 */
import { WebhookModel, DeliveryModel } from "./schemas/webhook.model.js";
import { generateId } from "../utils/generateId.js";
import crypto from "crypto";

export class WebhookRepository {
  static async listByTenant(tenantId) {
    return await WebhookModel.find({ tenantId }).select("-secret").lean();
  }

  static async getSubscribedWebhooks(tenantId, event) {
    return await WebhookModel.find({ tenantId, enabled: true, events: event }).lean();
  }

  static async create(tenantId, { url, events, secret }) {
    const id = generateId("wh");
    const webhook = await WebhookModel.create({
      id,
      tenantId,
      url,
      events,
      secret: crypto.createHash("sha256").update(secret).digest("hex"),
      enabled: true,
    });
    return webhook.toObject();
  }

  static async remove(tenantId, webhookId) {
    const res = await WebhookModel.deleteOne({ tenantId, id: webhookId });
    return res.deletedCount > 0;
  }

  static async logDelivery(webhookId, event, log) {
    const entry = await DeliveryModel.findOneAndUpdate(
      { webhookId },
      {
        $push: {
          logs: {
            $each: [{ ...log, event, loggedAt: new Date() }],
            $position: 0,
            $slice: 100
          }
        }
      },
      { upsert: true, new: true }
    );
  }

  static async getDeliveries(tenantId, webhookId, { status } = {}) {
    const entry = await DeliveryModel.findOne({ webhookId }).lean();
    if (!entry) return [];

    let logs = entry.logs;
    if (status === "delivered") logs = logs.filter((d) => d.success);
    if (status === "failed") logs = logs.filter((d) => !d.success);
    return logs;
  }

  static async markFailed(webhookId, event) {
    await WebhookRepository.logDelivery(webhookId, event, {
      attempt: "final",
      status: 0,
      success: false,
      error: "Max retries exhausted",
    });
  }
}
