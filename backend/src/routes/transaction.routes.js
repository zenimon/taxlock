/**
 * routes/transaction.routes.js
 *
 * Mounts transaction endpoints and validates request bodies before
 * they reach the controller. Validation is done inline with express-validator
 * so errors are caught early with clear messages.
 */

import { Router } from "express";
import { body, query, validationResult } from "express-validator";
import { TransactionController } from "../controllers/transaction.controller.js";

const router = Router();

// Middleware: return 400 if any validation failed
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Request validation failed",
        details: errors.array(),
      },
    });
  }
  next();
};

/**
 * POST /transaction/allocate
 * Allocate an incoming transaction across fund buckets.
 */
router.post(
  "/allocate",
  [
    body("transactionId").isString().notEmpty().withMessage("transactionId is required"),
    body("amount").isFloat({ gt: 0 }).withMessage("amount must be a positive number"),
    body("currency").matches(/^[A-Z]{3}$/).withMessage("currency must be a 3-letter ISO code"),
    body("source").isIn(["invoice", "transfer", "subscription", "refund", "other"]),
  ],
  validate,
  TransactionController.allocate
);

/**
 * POST /transaction/assess
 * Risk-assess a proposed outbound expense.
 */
router.post(
  "/assess",
  [
    body("amount").isFloat({ gt: 0 }).withMessage("amount must be a positive number"),
    body("currency").matches(/^[A-Z]{3}$/),
    body("category").isIn(["payroll", "vendor", "rent", "software", "marketing", "capex", "other"]),
  ],
  validate,
  TransactionController.assess
);

/**
 * GET /transaction/history
 * Paginated allocation history.
 */
router.get(
  "/history",
  [
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("from").optional().isDate(),
    query("to").optional().isDate(),
  ],
  validate,
  TransactionController.history
);

export default router;
