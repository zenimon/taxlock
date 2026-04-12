/**
 * routes/simulation.routes.js
 *
 * All simulation endpoints are dry-run — nothing is persisted,
 * no webhooks fire, and the response always includes { simulated: true }.
 */
import { Router } from "express";
import { body, validationResult } from "express-validator";
import { SimulationController } from "../controllers/simulation.controller.js";

const router = Router();
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: { code: "VALIDATION_ERROR", details: errors.array() } });
  next();
};

/** POST /simulate/allocation — dry-run a single allocation */
router.post("/allocation", [
  body("amount").isFloat({ gt: 0 }),
  body("currency").matches(/^[A-Z]{3}$/),
  body("source").isString().notEmpty(),
  body("overrideRules").optional().isArray(),
], validate, SimulationController.allocation);

/** POST /simulate/cashflow — multi-period cashflow projection */
router.post("/cashflow", [
  body("periods").isInt({ min: 1, max: 60 }),
  body("periodUnit").optional().isIn(["month", "quarter"]),
  body("initialBalances").isObject(),
  body("projectedInflows").isArray(),
  body("projectedOutflows").isArray(),
  body("scenarios").optional().isArray(),
], validate, SimulationController.cashflow);

/** POST /simulate/rule-test — test a rule against sample transactions */
router.post("/rule-test", [
  body("rule").isObject(),
  body("sampleTransactions").isArray({ min: 1 }),
], validate, SimulationController.ruleTest);

export default router;
