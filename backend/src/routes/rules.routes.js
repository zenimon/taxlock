/**
 * routes/rules.routes.js
 */
import { Router } from "express";
import { body, param, validationResult } from "express-validator";
import { RulesController } from "../controllers/rules.controller.js";

const router = Router();
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: { code: "VALIDATION_ERROR", details: errors.array() } });
  next();
};

router.get("/", RulesController.list);
router.post("/", [
  body("name").isString().notEmpty(),
  body("trigger.event").isIn(["transaction.received", "expense.requested", "period.end"]),
  body("trigger.conditions").isArray(),
  body("action.type").isIn(["allocate", "block", "flag", "notify"]),
  body("priority").optional().isInt({ min: 0 }),
], validate, RulesController.create);
router.get("/:ruleId", [param("ruleId").isString()], validate, RulesController.get);
router.put("/:ruleId", [param("ruleId").isString(), body("name").isString().notEmpty()], validate, RulesController.update);
router.delete("/:ruleId", [param("ruleId").isString()], validate, RulesController.remove);

export default router;
