/**
 * models/webhook.repository.js
 */
import { generateId } from "../utils/generateId.js";
import crypto from "crypto";

const webhooks = new Map();     // tenantId → Webhook[]
const deliveries = new Map();   // webhookId → DeliveryLog[]

export class WebhookRepository {
  static async listByTenant(tenantId) {
    return (webhooks.get(tenantId) ?? []).map(({ secret: _s, ...w }) => w); // never expose secret
  }

  static async getSubscribedWebhooks(tenantId, event) {
    return (webhooks.get(tenantId) ?? []).filter((w) => w.enabled && w.events.includes(event));
  }

  static async create(tenantId, { url, events, secret }) {
    const list = webhooks.get(tenantId) ?? [];
    const webhook = {
      id: generateId("wh"),
      url,
      events,
      secret: crypto.createHash("sha256").update(secret).digest("hex"), // store hashed
      _rawSecret: secret, // in prod, store only the hash and return raw once
      enabled: true,
      createdAt: new Date().toISOString(),
    };
    list.push(webhook);
    webhooks.set(tenantId, list);
    return webhook;
  }

  static async remove(tenantId, webhookId) {
    const list = webhooks.get(tenantId) ?? [];
    const idx = list.findIndex((w) => w.id === webhookId);
    if (idx === -1) return false;
    list.splice(idx, 1);
    webhooks.set(tenantId, list);
    return true;
  }

  static async logDelivery(webhookId, event, log) {
    const list = deliveries.get(webhookId) ?? [];
    list.unshift({ ...log, event, loggedAt: new Date().toISOString() });
    deliveries.set(webhookId, list.slice(0, 100)); // keep last 100
  }

  static async getDeliveries(tenantId, webhookId, { status } = {}) {
    const list = deliveries.get(webhookId) ?? [];
    if (!status) return list;
    return list.filter((d) => {
      if (status === "delivered") return d.success;
      if (status === "failed") return !d.success;
      return true;
    });
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
