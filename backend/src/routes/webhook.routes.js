/**
 * routes/webhook.routes.js
 */
import { Router } from "express";
import { body, param, query, validationResult } from "express-validator";
import { WebhookController } from "../controllers/webhook.controller.js";

const router = Router();
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: { code: "VALIDATION_ERROR", details: errors.array() } });
  next();
};

const VALID_EVENTS = [
  "transaction.allocated", "risk.flagged", "rule.triggered",
  "expense.blocked", "expense.approved",
];

router.get("/", WebhookController.list);
router.post("/", [
  body("url").isURL(),
  body("events").isArray({ min: 1 }),
  body("events.*").isIn(VALID_EVENTS),
], validate, WebhookController.create);
router.delete("/:webhookId", [param("webhookId").isString()], validate, WebhookController.remove);
router.get("/:webhookId/deliveries", [
  param("webhookId").isString(),
  query("status").optional().isIn(["delivered", "failed", "pending"]),
], validate, WebhookController.deliveries);

export default router;
