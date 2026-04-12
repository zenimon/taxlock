/**
 * services/webhook.service.js
 *
 * Manages webhook event delivery with retry logic and signature verification.
 *
 * Delivery flow:
 *   1. Load all registered webhooks for the tenant that subscribe to this event.
 *   2. For each webhook, build the signed payload and POST to the registered URL.
 *   3. If delivery fails (non-2xx or timeout), schedule retries with exponential backoff.
 *   4. Log every delivery attempt for the delivery history endpoint.
 *
 * Payload signing:
 *   Each delivery includes X-Decision-Signature: sha256=<hmac-hex>
 *   Consumers verify: HMAC-SHA256(rawBody, webhookSecret) === signature
 */

import crypto from "crypto";
import { WebhookRepository } from "../models/webhook.repository.js";
import { config } from "../../config/env.js";

const RETRY_DELAYS_MS = [5_000, 25_000, 125_000]; // 5s, 25s, ~2min

export class WebhookService {
  /**
   * Dispatch an event to all subscribed webhooks for a tenant.
   * This is intentionally fire-and-forget — errors are logged but not re-thrown.
   */
  static async dispatch(tenantId, event, data) {
    const webhooks = await WebhookRepository.getSubscribedWebhooks(tenantId, event);

    for (const webhook of webhooks) {
      WebhookService._deliverWithRetry(webhook, event, data, 0).catch((err) => {
        console.error(`Webhook ${webhook.id} permanently failed for event ${event}:`, err.message);
        WebhookRepository.markFailed(webhook.id, event).catch(console.error);
      });
    }
  }

  /**
   * Deliver a single webhook event, retrying on failure.
   */
  static async _deliverWithRetry(webhook, event, data, attempt) {
    const payload = {
      event,
      webhookId: webhook.id,
      deliveredAt: new Date().toISOString(),
      data,
    };
    const body = JSON.stringify(payload);
    const signature = WebhookService._sign(body, webhook.secret);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), config.WEBHOOK_TIMEOUT_MS);

      const response = await fetch(webhook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Decision-Signature": `sha256=${signature}`,
          "X-Decision-Event": event,
          "X-Decision-Attempt": String(attempt + 1),
        },
        body,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      await WebhookRepository.logDelivery(webhook.id, event, {
        attempt: attempt + 1,
        status: response.status,
        success: response.ok,
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
    } catch (err) {
      await WebhookRepository.logDelivery(webhook.id, event, {
        attempt: attempt + 1,
        status: 0,
        success: false,
        error: err.message,
      });

      if (attempt < config.WEBHOOK_RETRY_ATTEMPTS - 1) {
        await WebhookService._delay(RETRY_DELAYS_MS[attempt] ?? 125_000);
        return WebhookService._deliverWithRetry(webhook, event, data, attempt + 1);
      }

      throw err; // Exhaust retries — caller logs and marks failed
    }
  }

  static _sign(body, secret) {
    return crypto.createHmac("sha256", secret).update(body).digest("hex");
  }

  static _delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Utility for consumers to verify incoming webhook payloads.
   * Usage: WebhookService.verifySignature(rawBody, secret, req.headers['x-decision-signature'])
   */
  static verifySignature(rawBody, secret, signatureHeader) {
    const expected = `sha256=${WebhookService._sign(rawBody, secret)}`;
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signatureHeader));
  }
}
