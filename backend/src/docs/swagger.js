/**
 * docs/swagger.js
 *
 * Builds the full OpenAPI 3.0 specification for TaxFlow.
 * This file is the single source of documentation — every endpoint,
 * schema, and example lives here so docs are always in sync with the code.
 *
 * Served as JSON at GET /docs.json
 * Served as interactive UI at GET /docs
 */

export const swaggerSpec = {
  openapi: "3.0.3",
  info: {
    title: "TaxFlow API",
    version: "1.0.0",
    description: `
## Overview

The **TaxFlow API** is an embedded financial intelligence layer for small and medium businesses.
It intercepts every money event in real time and returns allocation decisions, risk scores,
and spend approvals — so businesses never move money blindly.

## How it works

1. Money arrives (invoice paid, transfer received).
2. You call \`POST /transaction/allocate\` — we return how to split it across tax, ops, growth.
3. Before spending, call \`POST /transaction/assess\` — we return a risk score and recommendation.
4. Define your own policies via \`POST /rules\` — these override our defaults.
5. Test hypotheticals with \`POST /simulate\` before committing real money.

## Authentication

All endpoints (except \`/health\`) require an API key passed as a header:

\`\`\`
X-API-Key: your_api_key_here
\`\`\`

## Versioning

The current version is \`v1\`. Breaking changes will increment this to \`v2\` — old versions remain live for 12 months after deprecation notice.

## Errors

All errors follow a consistent shape:
\`\`\`json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable description",
    "details": {}
  }
}
\`\`\`

## Webhooks

Register a URL via \`POST /webhooks\` to receive real-time push events when allocations, risk flags, or rule triggers occur.
    `,
    contact: {
      name: "TaxFlow Support",
      email: "api@taxflow.dev",
    },
    license: { name: "MIT" },
  },

  servers: [
    { url: "http://localhost:3000/api/v1", description: "Local development" },
    { url: "https://api.taxflow.dev/v1", description: "Production" },
  ],

  security: [{ ApiKeyAuth: [] }],

  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: "apiKey",
        in: "header",
        name: "X-API-Key",
        description: "Your tenant API key. Obtain from the dashboard.",
      },
    },

    schemas: {
      // ── Shared primitives ─────────────────────────────────────────────────
      Money: {
        type: "object",
        required: ["amount", "currency"],
        properties: {
          amount: {
            type: "number",
            format: "double",
            description: "Positive decimal amount. Up to 2 decimal places.",
            example: 125000.5,
          },
          currency: {
            type: "string",
            pattern: "^[A-Z]{3}$",
            description: "ISO 4217 currency code.",
            example: "INR",
          },
        },
      },

      AllocationBucket: {
        type: "object",
        description: "A single fund bucket in an allocation decision.",
        properties: {
          bucket: {
            type: "string",
            enum: ["tax", "operations", "growth", "reserve", "custom"],
            description: "The category this portion of funds is routed to.",
          },
          percentage: {
            type: "number",
            minimum: 0,
            maximum: 100,
            description: "Percentage of the transaction amount allocated here.",
            example: 18,
          },
          amount: {
            type: "number",
            description: "Exact rupee/currency amount for this bucket.",
            example: 22500,
          },
          reason: {
            type: "string",
            description: "Human-readable explanation for this allocation.",
            example: "GST reserve at 18% of revenue",
          },
        },
      },

      RiskScore: {
        type: "object",
        properties: {
          score: {
            type: "number",
            minimum: 0,
            maximum: 1,
            description: "Risk score between 0 (no risk) and 1 (maximum risk).",
            example: 0.67,
          },
          level: {
            type: "string",
            enum: ["low", "medium", "high", "critical"],
            example: "medium",
          },
          recommendation: {
            type: "string",
            enum: ["approve", "review", "block"],
            description: "What the API recommends doing with this transaction.",
          },
          factors: {
            type: "array",
            description: "Individual risk signals that contributed to this score.",
            items: {
              type: "object",
              properties: {
                factor: { type: "string", example: "large_single_expense" },
                weight: { type: "number", example: 0.3 },
                description: { type: "string", example: "Expense exceeds 40% of monthly average" },
              },
            },
          },
        },
      },

      Rule: {
        type: "object",
        required: ["name", "trigger", "action"],
        properties: {
          id: { type: "string", format: "uuid", readOnly: true },
          name: { type: "string", example: "GST auto-reserve" },
          description: { type: "string" },
          trigger: {
            type: "object",
            description: "Condition that activates this rule.",
            properties: {
              event: {
                type: "string",
                enum: ["transaction.received", "expense.requested", "period.end"],
              },
              conditions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    field: { type: "string", example: "amount" },
                    operator: { type: "string", enum: ["gt", "lt", "eq", "gte", "lte", "contains"] },
                    value: { example: 10000 },
                  },
                },
              },
            },
          },
          action: {
            type: "object",
            description: "What to do when the trigger fires.",
            properties: {
              type: { type: "string", enum: ["allocate", "block", "flag", "notify"] },
              params: { type: "object", additionalProperties: true },
            },
          },
          priority: {
            type: "integer",
            description: "Lower number = evaluated first. Rules are applied in priority order.",
            example: 10,
          },
          enabled: { type: "boolean", default: true },
          createdAt: { type: "string", format: "date-time", readOnly: true },
        },
      },

      WebhookRegistration: {
        type: "object",
        required: ["url", "events"],
        properties: {
          id: { type: "string", format: "uuid", readOnly: true },
          url: { type: "string", format: "uri", example: "https://yourapp.com/webhooks/decision" },
          events: {
            type: "array",
            items: {
              type: "string",
              enum: [
                "transaction.allocated",
                "risk.flagged",
                "rule.triggered",
                "expense.blocked",
                "expense.approved",
              ],
            },
          },
          secret: {
            type: "string",
            readOnly: true,
            description: "HMAC secret for verifying webhook payloads. Shown only on creation.",
          },
          enabled: { type: "boolean", default: true },
        },
      },

      Error: {
        type: "object",
        properties: {
          error: {
            type: "object",
            properties: {
              code: { type: "string", example: "VALIDATION_ERROR" },
              message: { type: "string", example: "amount must be a positive number" },
              details: { type: "object" },
            },
          },
        },
      },
    },

    responses: {
      Unauthorized: {
        description: "Missing or invalid API key.",
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
      },
      ValidationError: {
        description: "Request body failed validation.",
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
      },
      NotFound: {
        description: "Resource not found.",
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
      },
    },
  },

  paths: {
    // ── Health ───────────────────────────────────────────────────────────────
    "/health": {
      get: {
        tags: ["System"],
        summary: "Health check",
        description: "Returns API status, version, and database connectivity. No auth required. Use this for uptime monitors.",
        security: [],
        responses: {
          200: {
            description: "API is healthy.",
            content: {
              "application/json": {
                example: {
                  status: "ok",
                  version: "1.0.0",
                  uptime: 3600,
                  db: "connected",
                },
              },
            },
          },
        },
      },
    },

    // ── Transaction: Allocate ────────────────────────────────────────────────
    "/transaction/allocate": {
      post: {
        tags: ["Transactions"],
        summary: "Allocate incoming funds",
        description: `
**The core endpoint.** Call this every time money arrives — an invoice is paid, a transfer lands, a subscription renews.

The API evaluates the transaction against your active rules, applies default allocation logic if no rules match, and returns a split showing exactly how much goes to tax reserve, operations, growth capital, and any custom buckets you've defined.

**What happens internally:**
1. Tenant rules are loaded and evaluated in priority order.
2. The first matching rule's action is applied.
3. If no rule matches, the system default (configurable) is used.
4. An \`transaction.allocated\` webhook event is dispatched if you have a registered endpoint.

**Idempotency:** Pass \`X-Idempotency-Key\` to safely retry — duplicate keys return the cached response without re-processing.
        `,
        parameters: [
          {
            in: "header",
            name: "X-Idempotency-Key",
            schema: { type: "string" },
            description: "Unique key for idempotent retries. Use the transaction ID from your bank.",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["transactionId", "amount", "currency", "source"],
                properties: {
                  transactionId: {
                    type: "string",
                    description: "Your internal or bank-issued transaction ID.",
                    example: "txn_rzp_abc123",
                  },
                  amount: { type: "number", example: 125000 },
                  currency: { type: "string", example: "INR" },
                  source: {
                    type: "string",
                    enum: ["invoice", "transfer", "subscription", "refund", "other"],
                    example: "invoice",
                  },
                  metadata: {
                    type: "object",
                    description: "Any additional data your rules reference (client ID, product line, etc.)",
                    additionalProperties: true,
                  },
                },
              },
              example: {
                transactionId: "txn_rzp_abc123",
                amount: 125000,
                currency: "INR",
                source: "invoice",
                metadata: { clientId: "client_007", category: "consulting" },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Allocation decision returned successfully.",
            content: {
              "application/json": {
                example: {
                  allocationId: "alloc_9f2c1d",
                  transactionId: "txn_rzp_abc123",
                  totalAmount: 125000,
                  currency: "INR",
                  allocations: [
                    { bucket: "tax", percentage: 18, amount: 22500, reason: "GST reserve at 18%" },
                    { bucket: "operations", percentage: 50, amount: 62500, reason: "Operational float" },
                    { bucket: "growth", percentage: 32, amount: 40000, reason: "Remaining to growth capital" },
                  ],
                  ruleApplied: "GST auto-reserve",
                  processedAt: "2026-04-12T10:30:00Z",
                },
              },
            },
          },
          400: { $ref: "#/components/responses/ValidationError" },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },

    // ── Transaction: Assess ──────────────────────────────────────────────────
    "/transaction/assess": {
      post: {
        tags: ["Transactions"],
        summary: "Assess risk before spending",
        description: `
**Pre-spend risk gate.** Before approving any outbound payment, call this endpoint with the proposed expense details.

The risk engine evaluates multiple factors: spend size relative to historical averages, remaining balance in the relevant bucket, frequency of similar transactions, and any custom risk rules you've configured.

Returns a score from 0–1, a level (low/medium/high/critical), a recommendation (approve/review/block), and a breakdown of which factors drove the score.

**Typical integration pattern:**
- User initiates a payment in your app.
- You call \`/assess\` silently.
- If \`recommendation = "approve"\`, proceed automatically.
- If \`recommendation = "review"\`, surface the risk details to the business owner.
- If \`recommendation = "block"\`, prevent the payment and explain why.
        `,
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["amount", "currency", "category"],
                properties: {
                  amount: { type: "number", example: 45000 },
                  currency: { type: "string", example: "INR" },
                  category: {
                    type: "string",
                    enum: ["payroll", "vendor", "rent", "software", "marketing", "capex", "other"],
                    example: "vendor",
                  },
                  vendorId: { type: "string", description: "Optional. Used for vendor-level risk history." },
                  metadata: { type: "object", additionalProperties: true },
                },
              },
              example: {
                amount: 45000,
                currency: "INR",
                category: "vendor",
                vendorId: "vendor_acme",
                metadata: { description: "Office supplies purchase" },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Risk assessment completed.",
            content: {
              "application/json": {
                example: {
                  assessmentId: "asmt_3b7f9a",
                  recommendation: "review",
                  risk: {
                    score: 0.67,
                    level: "medium",
                    factors: [
                      { factor: "large_single_expense", weight: 0.3, description: "Exceeds 40% of monthly average for vendor category" },
                      { factor: "low_ops_balance", weight: 0.37, description: "Operations bucket at 22% — below 30% safety threshold" },
                    ],
                  },
                  currentBucketBalances: {
                    operations: { balance: 13750, percentage: 22 },
                    tax: { balance: 22500, percentage: 100 },
                    growth: { balance: 40000, percentage: 100 },
                  },
                  assessedAt: "2026-04-12T10:31:00Z",
                },
              },
            },
          },
          400: { $ref: "#/components/responses/ValidationError" },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },

    // ── Transaction history ──────────────────────────────────────────────────
    "/transaction/history": {
      get: {
        tags: ["Transactions"],
        summary: "List allocation history",
        description: "Returns paginated allocation decisions made for this tenant, newest first. Useful for audit trails and dashboard displays.",
        parameters: [
          { in: "query", name: "page", schema: { type: "integer", default: 1 } },
          { in: "query", name: "limit", schema: { type: "integer", default: 20, maximum: 100 } },
          { in: "query", name: "from", schema: { type: "string", format: "date" }, description: "Filter from date (YYYY-MM-DD)" },
          { in: "query", name: "to", schema: { type: "string", format: "date" } },
          { in: "query", name: "bucket", schema: { type: "string" }, description: "Filter by bucket name" },
        ],
        responses: {
          200: {
            description: "Paginated list of allocations.",
            content: {
              "application/json": {
                example: {
                  data: [],
                  pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
                },
              },
            },
          },
        },
      },
    },

    // ── Rules ────────────────────────────────────────────────────────────────
    "/rules": {
      get: {
        tags: ["Rules"],
        summary: "List all rules",
        description: "Returns all allocation and risk rules for this tenant, sorted by priority. Rules are evaluated in this order on every transaction.",
        responses: {
          200: {
            description: "Array of rules.",
            content: {
              "application/json": {
                example: {
                  data: [],
                  total: 0,
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Rules"],
        summary: "Create a new rule",
        description: `
Define a custom allocation or risk rule that overrides the system defaults.

**Rules are evaluated in \`priority\` order** (lowest number first). The first rule whose \`trigger.conditions\` all pass is applied — subsequent rules are skipped for that transaction.

**Trigger events:**
- \`transaction.received\` — fires on every \`/allocate\` call.
- \`expense.requested\` — fires on every \`/assess\` call.
- \`period.end\` — fires at end of month/quarter (for rebalancing rules).

**Action types:**
- \`allocate\` — override the default bucket split.
- \`block\` — prevent the transaction from proceeding.
- \`flag\` — mark for manual review but don't block.
- \`notify\` — send an alert to a specified channel.

**Example: Auto-reserve 18% GST on every invoice over ₹10,000**
\`\`\`json
{
  "name": "GST reserve — large invoices",
  "trigger": {
    "event": "transaction.received",
    "conditions": [
      { "field": "amount", "operator": "gte", "value": 10000 },
      { "field": "source", "operator": "eq", "value": "invoice" }
    ]
  },
  "action": {
    "type": "allocate",
    "params": {
      "buckets": [
        { "bucket": "tax", "percentage": 18 },
        { "bucket": "operations", "percentage": 52 },
        { "bucket": "growth", "percentage": 30 }
      ]
    }
  },
  "priority": 10
}
\`\`\`
        `,
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Rule" },
            },
          },
        },
        responses: {
          201: {
            description: "Rule created.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Rule" },
              },
            },
          },
          400: { $ref: "#/components/responses/ValidationError" },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },

    "/rules/{ruleId}": {
      get: {
        tags: ["Rules"],
        summary: "Get a single rule",
        parameters: [{ in: "path", name: "ruleId", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Rule found.", content: { "application/json": { schema: { $ref: "#/components/schemas/Rule" } } } },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
      put: {
        tags: ["Rules"],
        summary: "Update a rule",
        description: "Full replacement of the rule. Any field not sent is reset to its default.",
        parameters: [{ in: "path", name: "ruleId", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/Rule" } } },
        },
        responses: {
          200: { description: "Rule updated." },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
      delete: {
        tags: ["Rules"],
        summary: "Delete a rule",
        description: "Permanently removes the rule. The system default allocation takes over for transactions that previously matched this rule.",
        parameters: [{ in: "path", name: "ruleId", required: true, schema: { type: "string" } }],
        responses: {
          204: { description: "Rule deleted." },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
    },

    // ── Simulation ───────────────────────────────────────────────────────────
    "/simulate/allocation": {
      post: {
        tags: ["Simulation"],
        summary: "Simulate an allocation",
        description: `
**Dry-run mode for \`/transaction/allocate\`.** Identical inputs, identical logic — but nothing is persisted and no webhooks fire.

Use this to:
- Show a new customer what their allocation would look like before they go live.
- Test a new rule before enabling it (pass \`overrideRules\` to try a hypothetical rule set).
- Build a "what would happen if I received X?" calculator in your UI.
        `,
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["amount", "currency", "source"],
                properties: {
                  amount: { type: "number" },
                  currency: { type: "string" },
                  source: { type: "string" },
                  overrideRules: {
                    type: "array",
                    description: "Hypothetical rules to test instead of your live rules.",
                    items: { $ref: "#/components/schemas/Rule" },
                  },
                },
              },
              example: {
                amount: 200000,
                currency: "INR",
                source: "invoice",
                overrideRules: [],
              },
            },
          },
        },
        responses: {
          200: {
            description: "Simulated allocation result.",
            content: {
              "application/json": {
                example: {
                  simulated: true,
                  allocations: [
                    { bucket: "tax", percentage: 18, amount: 36000 },
                    { bucket: "operations", percentage: 50, amount: 100000 },
                    { bucket: "growth", percentage: 32, amount: 64000 },
                  ],
                  ruleApplied: "GST auto-reserve",
                },
              },
            },
          },
        },
      },
    },

    "/simulate/cashflow": {
      post: {
        tags: ["Simulation"],
        summary: "Project cashflow over time",
        description: `
Given a set of expected inflows and outflows, project the business's bucket balances month by month.

Useful for:
- Answering "can I afford to hire next quarter?"
- Showing "if revenue drops 20%, when does the ops bucket run dry?"
- Running best/base/worst case scenarios.

Returns a timeline of bucket balances for each period, plus a summary of risk events (bucket going negative, tax reserve falling below legal minimums, etc).
        `,
        requestBody: {
          required: true,
          content: {
            "application/json": {
              example: {
                periods: 12,
                periodUnit: "month",
                initialBalances: {
                  tax: 22500,
                  operations: 62500,
                  growth: 40000,
                },
                projectedInflows: [
                  { amount: 125000, source: "invoice", frequency: "monthly" },
                ],
                projectedOutflows: [
                  { amount: 40000, category: "payroll", frequency: "monthly" },
                  { amount: 15000, category: "rent", frequency: "monthly" },
                ],
                scenarios: ["base", "downside_20pct"],
              },
            },
          },
        },
        responses: {
          200: {
            description: "Cashflow projection.",
            content: {
              "application/json": {
                example: {
                  simulated: true,
                  periods: [],
                  summary: { riskEvents: [], lowestBalance: {} },
                },
              },
            },
          },
        },
      },
    },

    "/simulate/rule-test": {
      post: {
        tags: ["Simulation"],
        summary: "Test a rule against sample transactions",
        description: `
Pass a rule definition and a batch of sample transactions. Returns which transactions would have matched, what action would have fired, and how many would have been unmatched (falling through to defaults).

Designed to be called from a rule editor UI before the user saves a new rule.
        `,
        requestBody: {
          required: true,
          content: {
            "application/json": {
              example: {
                rule: {
                  trigger: {
                    event: "transaction.received",
                    conditions: [{ field: "amount", operator: "gte", value: 50000 }],
                  },
                  action: { type: "allocate", params: { buckets: [{ bucket: "tax", percentage: 20 }] } },
                },
                sampleTransactions: [
                  { amount: 30000, source: "invoice" },
                  { amount: 80000, source: "invoice" },
                  { amount: 120000, source: "transfer" },
                ],
              },
            },
          },
        },
        responses: {
          200: {
            description: "Rule test results.",
            content: {
              "application/json": {
                example: {
                  matched: 2,
                  unmatched: 1,
                  results: [],
                },
              },
            },
          },
        },
      },
    },

    // ── Webhooks ─────────────────────────────────────────────────────────────
    "/webhooks": {
      get: {
        tags: ["Webhooks"],
        summary: "List registered webhooks",
        responses: {
          200: { description: "Array of webhook registrations." },
        },
      },
      post: {
        tags: ["Webhooks"],
        summary: "Register a webhook endpoint",
        description: `
Register a URL to receive real-time push events.

**Payload verification:** Each delivery includes an \`X-Decision-Signature\` header — an HMAC-SHA256 hex digest of the raw payload, signed with the \`secret\` returned on registration. Always verify this before processing.

**Retry policy:** Failed deliveries (non-2xx or timeout) are retried 3 times with exponential backoff (5s, 25s, 125s). After 3 failures, the event is marked \`failed\` and the webhook is flagged for your attention.

**Event shapes** — all events share a common envelope:
\`\`\`json
{
  "event": "transaction.allocated",
  "webhookId": "wh_abc",
  "deliveredAt": "2026-04-12T10:30:00Z",
  "data": { ... }
}
\`\`\`
        `,
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/WebhookRegistration" },
              example: {
                url: "https://yourapp.com/webhooks/decision",
                events: ["transaction.allocated", "risk.flagged"],
              },
            },
          },
        },
        responses: {
          201: {
            description: "Webhook registered. Save the secret — it is only shown once.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/WebhookRegistration" },
              },
            },
          },
        },
      },
    },

    "/webhooks/{webhookId}": {
      delete: {
        tags: ["Webhooks"],
        summary: "Delete a webhook",
        parameters: [{ in: "path", name: "webhookId", required: true, schema: { type: "string" } }],
        responses: {
          204: { description: "Webhook deleted." },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
    },

    "/webhooks/{webhookId}/deliveries": {
      get: {
        tags: ["Webhooks"],
        summary: "List delivery attempts",
        description: "Returns the delivery log for a webhook — useful for debugging failed events.",
        parameters: [
          { in: "path", name: "webhookId", required: true, schema: { type: "string" } },
          { in: "query", name: "status", schema: { type: "string", enum: ["delivered", "failed", "pending"] } },
        ],
        responses: {
          200: { description: "Delivery log." },
        },
      },
    },
  },

  tags: [
    { name: "Transactions", description: "Core allocation and risk assessment endpoints." },
    { name: "Rules", description: "Define and manage custom allocation and risk rules." },
    { name: "Simulation", description: "Dry-run the engine without persisting data or firing webhooks." },
    { name: "Webhooks", description: "Register endpoints to receive real-time event push." },
    { name: "System", description: "Health and operational endpoints." },
  ],
};
