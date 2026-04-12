# Decision API

> Embedded financial intelligence for small and medium businesses.

The Decision API intercepts every money event in real time and tells you exactly how to split it — tax reserve, operations, growth capital — before it hits your account. It also risk-gates outbound payments so your clients never spend money they don't have.

---

## Quick start

```bash
# Clone and install
npm install

# Copy environment config
cp .env.example .env

# Start the dev server (with hot reload)
npm run dev

# Server runs on http://localhost:3000
# Interactive API docs at http://localhost:3000/docs
```

No database needed for local development — the server uses an in-memory store by default.

---

## Architecture

```
src/
├── index.js                   Entry point — boots Express, registers all middleware and routes
│
├── config/
│   └── env.js                 Single source of truth for all environment variables
│
├── routes/                    HTTP routing only — no business logic
│   ├── transaction.routes.js  POST /allocate, POST /assess, GET /history
│   ├── rules.routes.js        CRUD for /rules
│   ├── simulation.routes.js   POST /simulate/*
│   ├── webhook.routes.js      CRUD for /webhooks
│   └── health.routes.js       GET /health (no auth)
│
├── controllers/               Thin HTTP layer — validates, delegates, formats
│   ├── transaction.controller.js
│   ├── rules.controller.js
│   ├── simulation.controller.js
│   └── webhook.controller.js
│
├── services/                  All business logic lives here
│   ├── allocation.service.js  Core fund-splitting engine
│   ├── risk.service.js        Risk scoring and recommendation engine
│   ├── rules.engine.js        Pure condition evaluator (stateless, no I/O)
│   └── webhook.service.js     Event delivery with retry and signing
│
├── simulation/
│   └── cashflow.engine.js     Multi-period cashflow projection engine
│
├── middleware/
│   ├── authenticate.js        API key validation — attaches req.tenant
│   ├── errorHandler.js        Global error → consistent JSON response
│   ├── rateLimiter.js         Per-tenant sliding window rate limiting
│   └── requestLogger.js       Unique request IDs and response timing
│
├── models/                    Data access layer — swap DB without touching services
│   ├── transaction.repository.js
│   ├── rules.repository.js
│   ├── webhook.repository.js
│   └── tenant.repository.js
│
├── utils/
│   ├── AppError.js            Typed error class for consistent error handling
│   └── generateId.js          Prefixed ID generator (alloc_xxx, rule_xxx, etc.)
│
└── docs/
    └── swagger.js             Full OpenAPI 3.0 spec — all endpoints, schemas, examples

tests/
├── unit/
│   ├── rules.engine.test.js       Pure logic tests — no I/O, fast
│   └── allocation.service.test.js
└── integration/
    └── transaction.allocate.test.js  Full HTTP tests via supertest
```

---

## Key design decisions

### API-first, UI-second
Every feature — including the first-party dashboard — is built against the public API. There are no internal shortcuts or special admin endpoints. This discipline ensures the API is actually usable by partners.

### Services are pure, repositories are swappable
Business logic in `services/` only receives plain objects and returns plain objects. All I/O goes through `models/` repositories. To migrate from in-memory to Postgres, only the repository internals change — zero service edits.

### Rules engine is stateless
`RulesEngine` in `services/rules.engine.js` has no imports, no I/O, no side effects. It is a pure function: `(rules, context) → matchedRule | null`. This makes it trivially testable and safe to run in the simulation engine without worrying about state corruption.

### Simulation is identical to production
`/simulate/*` endpoints use the exact same service code as live endpoints — `AllocationService.simulateAllocate`, `CashflowEngine.project`. The only difference is that repositories are not called and webhooks are not fired. What you see in simulation is exactly what will happen in production.

### Webhook reliability
Deliveries are retried 3× with exponential backoff (5s → 25s → 125s). Every attempt is logged in the delivery history. Consumers must verify the `X-Decision-Signature` HMAC header before processing any payload.

---

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/transaction/allocate` | Allocate incoming funds across buckets |
| POST | `/api/v1/transaction/assess` | Risk-assess a proposed expense |
| GET | `/api/v1/transaction/history` | Paginated allocation history |
| GET | `/api/v1/rules` | List all rules |
| POST | `/api/v1/rules` | Create a rule |
| GET | `/api/v1/rules/:id` | Get a single rule |
| PUT | `/api/v1/rules/:id` | Update a rule |
| DELETE | `/api/v1/rules/:id` | Delete a rule |
| POST | `/api/v1/simulate/allocation` | Dry-run a single allocation |
| POST | `/api/v1/simulate/cashflow` | Multi-period cashflow projection |
| POST | `/api/v1/simulate/rule-test` | Test a rule against sample transactions |
| GET | `/api/v1/webhooks` | List registered webhooks |
| POST | `/api/v1/webhooks` | Register a webhook |
| DELETE | `/api/v1/webhooks/:id` | Delete a webhook |
| GET | `/api/v1/webhooks/:id/deliveries` | Delivery history for a webhook |
| GET | `/api/v1/health` | Health check (no auth) |

Full interactive documentation with request/response examples: `GET /docs`

---

## Authentication

All endpoints except `/health` require an API key:

```
X-API-Key: your_api_key_here
```

For local development, two keys are pre-loaded:
- `dev-key-001` → tenant `Acme Corp`
- `dev-key-002` → tenant `Beta Foods`

---

## Example: allocate an invoice payment

```bash
curl -X POST http://localhost:3000/api/v1/transaction/allocate \
  -H "X-API-Key: dev-key-001" \
  -H "Content-Type: application/json" \
  -d '{
    "transactionId": "txn_rzp_abc123",
    "amount": 125000,
    "currency": "INR",
    "source": "invoice"
  }'
```

Response:
```json
{
  "allocationId": "alloc_9f2c1d",
  "transactionId": "txn_rzp_abc123",
  "totalAmount": 125000,
  "currency": "INR",
  "allocations": [
    { "bucket": "tax",        "percentage": 18, "amount": 22500, "reason": "Default GST reserve" },
    { "bucket": "operations", "percentage": 52, "amount": 65000, "reason": "Default operational float" },
    { "bucket": "growth",     "percentage": 30, "amount": 37500, "reason": "Default growth capital" }
  ],
  "ruleApplied": "system_default",
  "processedAt": "2026-04-12T10:30:00Z"
}
```

## Example: create a custom rule

```bash
curl -X POST http://localhost:3000/api/v1/rules \
  -H "X-API-Key: dev-key-001" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "GST reserve — large invoices",
    "trigger": {
      "event": "transaction.received",
      "conditions": [
        { "field": "amount", "operator": "gte", "value": 100000 },
        { "field": "source", "operator": "eq", "value": "invoice" }
      ]
    },
    "action": {
      "type": "allocate",
      "params": {
        "buckets": [
          { "bucket": "tax",        "percentage": 20 },
          { "bucket": "operations", "percentage": 50 },
          { "bucket": "growth",     "percentage": 30 }
        ]
      }
    },
    "priority": 10
  }'
```

## Example: simulate cashflow over 12 months

```bash
curl -X POST http://localhost:3000/api/v1/simulate/cashflow \
  -H "X-API-Key: dev-key-001" \
  -H "Content-Type: application/json" \
  -d '{
    "periods": 12,
    "periodUnit": "month",
    "initialBalances": { "tax": 22500, "operations": 62500, "growth": 40000 },
    "projectedInflows": [
      { "amount": 125000, "source": "invoice", "frequency": "monthly" }
    ],
    "projectedOutflows": [
      { "amount": 40000, "category": "payroll", "frequency": "monthly" },
      { "amount": 15000, "category": "rent",    "frequency": "monthly" }
    ],
    "scenarios": ["base", "downside_20pct"]
  }'
```

---

## Running tests

```bash
# All tests
npm test

# Unit tests only (fast, no HTTP)
npm run test:unit

# Integration tests
npm run test:integration

# With coverage report
npm run test:coverage
```

---

## Moving to production

1. Set `NODE_ENV=production` in your environment.
2. Replace `DATABASE_URL` with a real Postgres connection string.
3. Implement repository methods to query the database instead of the in-memory Maps.
4. Use a secrets manager for `API_KEY_SECRET` and `JWT_SECRET`.
5. Set `ALLOWED_ORIGINS` to your actual dashboard and partner domains.
6. Put the API behind a reverse proxy (nginx, Caddy) with TLS.

The in-memory repositories are designed as drop-in stubs — all method signatures match what a real DB layer would expose. Only the internals of each repository file change.
