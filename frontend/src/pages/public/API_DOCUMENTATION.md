# Decision API — Complete Documentation

> **Version:** 1.0.0 · **Base URL:** `https://api.decisionapi.dev/v1` · **Local:** `http://localhost:3000/api/v1`

---

## Table of Contents

1. [Introduction](#introduction)
2. [How it works](#how-it-works)
3. [Authentication](#authentication)
4. [Errors](#errors)
5. [Rate limiting](#rate-limiting)
6. [Webhooks](#webhooks)
7. [Endpoints](#endpoints)
   - [Health](#health)
   - [Transactions — Allocate](#post-transactionallocate)
   - [Transactions — Assess](#post-transactionassess)
   - [Transactions — History](#get-transactionhistory)
   - [Rules — List](#get-rules)
   - [Rules — Create](#post-rules)
   - [Rules — Update](#put-rulesid)
   - [Rules — Delete](#delete-rulesid)
   - [Simulate — Allocation](#post-simallocation)
   - [Simulate — Cashflow](#post-simcashflow)
   - [Simulate — Rule test](#post-simrule-test)
   - [Webhooks — List](#get-webhooks)
   - [Webhooks — Register](#post-webhooks)
   - [Webhooks — Delete](#delete-webhooksid)
   - [Webhooks — Deliveries](#get-webhooksiddeliveries)
8. [Data models](#data-models)
9. [Code examples](#code-examples)
10. [Quickstart guides](#quickstart-guides)
11. [FAQ](#faq)

---

## Introduction

The **Decision API** is an embedded financial intelligence layer for small and medium businesses. It sits between money flowing in and money going out — every transaction is automatically allocated across fund buckets (tax, operations, growth capital) and every proposed spend is risk-assessed before it leaves.

**The core problem it solves:** Most SMBs mix all funds in a single account and make spending decisions without understanding their future obligations. The Decision API prevents this by:

- Automatically splitting every incoming payment the moment it arrives
- Scoring every proposed expense against current balances and historical patterns
- Letting businesses define their own allocation rules
- Providing simulation tools to test scenarios before committing real money

**Who it's for:**

- Small and medium businesses wanting automated financial discipline
- Fintech platforms wanting to embed intelligent allocation into their product
- Developers building financial tooling on top of transaction data

---

## How it works

```
1. Money arrives        →  POST /transaction/allocate  →  Returns split: tax 18%, ops 52%, growth 30%
2. Before spending      →  POST /transaction/assess    →  Returns risk score + approve/review/block
3. Define your logic    →  POST /rules                 →  Rules override defaults on every transaction
4. Test before going live →  POST /simulate/*          →  Dry-run with no side effects
5. Get push events      →  Register webhook            →  Receive real-time events on allocations, flags
```

The API is stateless per request. Every call returns a complete decision — you don't need to poll.

---

## Authentication

All endpoints except `GET /health` require an API key.

### Request header

```
X-API-Key: your_api_key_here
```

### Getting your API key

Your API key is issued when you create a tenant account. It is shown once in the dashboard under **Settings → API Keys**.

### Dev keys (local development)

Two keys work against the local dev server out of the box:

| Key | Tenant |
|-----|--------|
| `dev-key-001` | Acme Corp (starter plan) |
| `dev-key-002` | Beta Foods (growth plan) |

### Example

```bash
curl https://api.decisionapi.dev/v1/health \
  -H "X-API-Key: dev-key-001"
```

### What happens with an invalid key

```json
HTTP 401

{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid API key"
  }
}
```

---

## Errors

All errors return a consistent JSON envelope. Never parse the HTTP status code alone — always check `error.code` for machine-readable handling.

### Error shape

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "amount must be a positive number",
    "details": [
      { "field": "amount", "message": "must be greater than 0" }
    ]
  }
}
```

### Error codes

| HTTP | Code | Meaning |
|------|------|---------|
| 400 | `VALIDATION_ERROR` | Request body failed schema validation |
| 401 | `UNAUTHORIZED` | Missing or invalid API key |
| 404 | `NOT_FOUND` | Resource (rule, webhook) not found |
| 429 | `RATE_LIMIT_EXCEEDED` | Too many requests |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

### Handling errors in code

```javascript
// Node.js
try {
  const res = await axios.post('/transaction/allocate', payload);
  return res.data;
} catch (err) {
  const { code, message } = err.response.data.error;
  if (code === 'VALIDATION_ERROR') {
    // show field-level errors to user
  } else if (code === 'RATE_LIMIT_EXCEEDED') {
    // back off and retry
  }
}
```

```python
# Python
import requests

try:
    res = requests.post(f"{BASE}/transaction/allocate", json=payload, headers=headers)
    res.raise_for_status()
    return res.json()
except requests.HTTPError as e:
    error = e.response.json()["error"]
    print(f"Error {error['code']}: {error['message']}")
```

---

## Rate limiting

Limits are applied per tenant (per API key), not per IP.

| Plan | Requests per minute |
|------|-------------------|
| Starter | 60 |
| Growth | 300 |
| Enterprise | Custom |

### Rate limit headers

Every response includes:

```
RateLimit-Limit: 60
RateLimit-Remaining: 47
RateLimit-Reset: 1713000060
```

When the limit is hit you receive `HTTP 429`. Implement exponential backoff: wait 1s, then 2s, then 4s before retrying.

---

## Webhooks

Webhooks let you receive real-time push events instead of polling.

### Event types

| Event | Fired when |
|-------|-----------|
| `transaction.allocated` | Every call to `POST /transaction/allocate` succeeds |
| `risk.flagged` | An assessment returns medium/high/critical risk |
| `rule.triggered` | A custom rule fires on a transaction |
| `expense.approved` | Assessment returns `approve` |
| `expense.blocked` | Assessment returns `block` |

### Payload envelope

Every delivery POSTs this JSON to your endpoint:

```json
{
  "event": "transaction.allocated",
  "webhookId": "wh_9f2c",
  "deliveredAt": "2026-04-12T10:30:00Z",
  "data": {
    "allocationId": "alloc_4b7f",
    "totalAmount": 125000,
    "currency": "INR",
    "allocations": [
      { "bucket": "tax", "percentage": 18, "amount": 22500 },
      { "bucket": "operations", "percentage": 52, "amount": 65000 },
      { "bucket": "growth", "percentage": 30, "amount": 37500 }
    ]
  }
}
```

### Verifying signatures

Each delivery includes an HMAC-SHA256 signature in the header:

```
X-Decision-Signature: sha256=abc123...
```

**Always verify this before processing.** The signature is computed over the raw request body using the secret returned when you registered the webhook.

```javascript
// Node.js — Express
const crypto = require('crypto');

function verifyWebhook(req, secret) {
  const signature = req.headers['x-decision-signature'];
  const expected = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(req.rawBody) // must be the raw buffer, not parsed JSON
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

app.post('/webhooks/decision', express.raw({ type: 'application/json' }), (req, res) => {
  if (!verifyWebhook(req, process.env.WEBHOOK_SECRET)) {
    return res.status(401).send('Invalid signature');
  }
  const event = JSON.parse(req.body);
  // handle event.event ...
  res.status(200).send('ok');
});
```

```python
# Python — Flask
import hmac, hashlib

function verify_webhook(payload_bytes, secret, signature_header):
    expected = 'sha256=' + hmac.new(
        secret.encode(),
        payload_bytes,
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature_header)

@app.route('/webhooks/decision', methods=['POST'])
def handle_webhook():
    if not verify_webhook(request.data, WEBHOOK_SECRET, request.headers.get('X-Decision-Signature')):
        return 'Invalid signature', 401
    event = request.json
    # handle event ...
    return 'ok', 200
```

### Retry policy

Failed deliveries (non-2xx response or timeout) are retried 3 times with exponential backoff:

| Attempt | Delay |
|---------|-------|
| 1st retry | 5 seconds |
| 2nd retry | 25 seconds |
| 3rd retry | 125 seconds |

After 3 failures the event is marked `failed`. You can view the delivery log via `GET /webhooks/:id/deliveries`.

---

## Endpoints

---

### GET /health

Check API status. No authentication required.

**Response**

```json
{
  "status": "ok",
  "version": "1.0.0",
  "uptime": 3600,
  "timestamp": "2026-04-12T10:30:00Z"
}
```

---

### POST /transaction/allocate

**The core endpoint.** Call this every time money arrives — an invoice is paid, a transfer lands, a subscription renews.

Returns a complete allocation decision: how much goes to tax reserve, operations float, and growth capital. The allocation is determined by evaluating your active rules in priority order. If no rule matches, the system default (18% tax, 52% ops, 30% growth) applies.

**Idempotency:** Pass `X-Idempotency-Key` to safely retry failed requests. Duplicate keys return the cached response without re-processing.

#### Request

```
POST /transaction/allocate
X-API-Key: your_key
X-Idempotency-Key: txn_rzp_abc123   (optional but recommended)
Content-Type: application/json
```

```json
{
  "transactionId": "txn_rzp_abc123",
  "amount": 125000,
  "currency": "INR",
  "source": "invoice",
  "metadata": {
    "clientId": "client_007",
    "category": "consulting"
  }
}
```

#### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `transactionId` | string | yes | Your internal or bank-issued transaction ID |
| `amount` | number | yes | Positive decimal. Amount in the smallest meaningful unit (e.g. rupees, not paise) |
| `currency` | string | yes | ISO 4217 code — `INR`, `USD`, `EUR` |
| `source` | string | yes | `invoice` · `transfer` · `subscription` · `refund` · `other` |
| `metadata` | object | no | Any extra data your rules reference (clientId, productLine, etc.) |

#### Response `200`

```json
{
  "allocationId": "alloc_9f2c1d",
  "transactionId": "txn_rzp_abc123",
  "totalAmount": 125000,
  "currency": "INR",
  "allocations": [
    {
      "bucket": "tax",
      "percentage": 18,
      "amount": 22500,
      "reason": "GST reserve at 18%"
    },
    {
      "bucket": "operations",
      "percentage": 52,
      "amount": 65000,
      "reason": "Operational float"
    },
    {
      "bucket": "growth",
      "percentage": 30,
      "amount": 37500,
      "reason": "Remaining to growth capital"
    }
  ],
  "ruleApplied": "GST auto-reserve",
  "processedAt": "2026-04-12T10:30:00Z"
}
```

#### Code examples

**cURL**
```bash
curl -X POST https://api.decisionapi.dev/v1/transaction/allocate \
  -H "X-API-Key: dev-key-001" \
  -H "X-Idempotency-Key: txn_rzp_abc123" \
  -H "Content-Type: application/json" \
  -d '{
    "transactionId": "txn_rzp_abc123",
    "amount": 125000,
    "currency": "INR",
    "source": "invoice"
  }'
```

**Node.js**
```javascript
const axios = require('axios');

const client = axios.create({
  baseURL: 'https://api.decisionapi.dev/v1',
  headers: { 'X-API-Key': process.env.DECISION_API_KEY }
});

async function allocateIncomingPayment(transactionId, amount) {
  const { data } = await client.post('/transaction/allocate', {
    transactionId,
    amount,
    currency: 'INR',
    source: 'invoice'
  }, {
    headers: { 'X-Idempotency-Key': transactionId }
  });

  console.log(`Allocated ₹${amount}:`);
  data.allocations.forEach(a => {
    console.log(`  ${a.bucket}: ₹${a.amount} (${a.percentage}%)`);
  });

  return data;
}

allocateIncomingPayment('txn_001', 125000);
```

**Python**
```python
import os, requests

BASE = "https://api.decisionapi.dev/v1"
HEADERS = {"X-API-Key": os.environ["DECISION_API_KEY"]}

def allocate_payment(transaction_id: str, amount: float) -> dict:
    res = requests.post(
        f"{BASE}/transaction/allocate",
        json={
            "transactionId": transaction_id,
            "amount": amount,
            "currency": "INR",
            "source": "invoice",
        },
        headers={**HEADERS, "X-Idempotency-Key": transaction_id},
    )
    res.raise_for_status()
    result = res.json()

    for alloc in result["allocations"]:
        print(f"{alloc['bucket']}: ₹{alloc['amount']} ({alloc['percentage']}%)")

    return result

allocate_payment("txn_001", 125000)
```

**Go**
```go
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "net/http"
    "os"
)

type AllocateRequest struct {
    TransactionID string  `json:"transactionId"`
    Amount        float64 `json:"amount"`
    Currency      string  `json:"currency"`
    Source        string  `json:"source"`
}

func allocatePayment(txnID string, amount float64) error {
    body, _ := json.Marshal(AllocateRequest{
        TransactionID: txnID,
        Amount:        amount,
        Currency:      "INR",
        Source:        "invoice",
    })

    req, _ := http.NewRequest("POST",
        "https://api.decisionapi.dev/v1/transaction/allocate",
        bytes.NewBuffer(body),
    )
    req.Header.Set("Content-Type", "application/json")
    req.Header.Set("X-API-Key", os.Getenv("DECISION_API_KEY"))
    req.Header.Set("X-Idempotency-Key", txnID)

    resp, err := http.DefaultClient.Do(req)
    if err != nil {
        return err
    }
    defer resp.Body.Close()
    fmt.Println("Status:", resp.Status)
    return nil
}
```

---

### POST /transaction/assess

**Pre-spend risk gate.** Call this before approving any outbound payment. Returns a score from 0–1, a risk level, and a recommendation (`approve` / `review` / `block`).

#### Request

```json
{
  "amount": 45000,
  "currency": "INR",
  "category": "vendor",
  "vendorId": "vendor_acme",
  "metadata": {
    "description": "Office supplies"
  }
}
```

#### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `amount` | number | yes | Proposed spend amount |
| `currency` | string | yes | ISO 4217 |
| `category` | string | yes | `payroll` · `vendor` · `rent` · `software` · `marketing` · `capex` · `other` |
| `vendorId` | string | no | Used to look up vendor-level risk history |
| `metadata` | object | no | Any additional context |

#### Response `200`

```json
{
  "assessmentId": "asmt_3b7f9a",
  "recommendation": "review",
  "risk": {
    "score": 0.67,
    "level": "medium",
    "factors": [
      {
        "factor": "large_single_expense",
        "weight": 0.3,
        "description": "Expense exceeds 40% of monthly average for vendor category"
      },
      {
        "factor": "low_ops_balance",
        "weight": 0.37,
        "description": "Operations bucket will fall to 22% — below 30% safety threshold"
      }
    ]
  },
  "currentBucketBalances": {
    "operations": { "balance": 13750, "percentage": 22 },
    "tax": { "balance": 22500, "percentage": 100 },
    "growth": { "balance": 40000, "percentage": 100 }
  },
  "assessedAt": "2026-04-12T10:31:00Z"
}
```

#### Risk levels

| Score | Level | Recommendation | Suggested action |
|-------|-------|----------------|-----------------|
| 0.00–0.39 | `low` | `approve` | Auto-proceed |
| 0.40–0.74 | `medium` | `review` | Show risk details to owner |
| 0.75–0.89 | `high` | `review` | Require explicit approval |
| 0.90–1.00 | `critical` | `block` | Prevent payment |

#### Code examples

**Node.js — typical integration pattern**
```javascript
async function checkBeforePayment(payment) {
  const { data } = await client.post('/transaction/assess', {
    amount: payment.amount,
    currency: payment.currency,
    category: payment.category,
    vendorId: payment.vendorId,
  });

  switch (data.recommendation) {
    case 'approve':
      return processPayment(payment);  // proceed automatically

    case 'review':
      return notifyOwner(payment, data.risk);  // surface risk, wait for approval

    case 'block':
      return rejectPayment(payment, data.risk.factors);  // prevent and explain
  }
}
```

**Python**
```python
def check_before_payment(amount, category, vendor_id=None):
    res = requests.post(f"{BASE}/transaction/assess", json={
        "amount": amount,
        "currency": "INR",
        "category": category,
        "vendorId": vendor_id,
    }, headers=HEADERS)
    res.raise_for_status()
    data = res.json()

    rec = data["recommendation"]
    score = data["risk"]["score"]
    print(f"Recommendation: {rec} (score: {score:.2f})")

    if rec == "block":
        for factor in data["risk"]["factors"]:
            print(f"  Risk: {factor['description']}")

    return data
```

---

### GET /transaction/history

Returns paginated allocation history for your tenant, newest first.

#### Query parameters

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | integer | 1 | Page number |
| `limit` | integer | 20 | Results per page (max 100) |
| `from` | date | — | Filter from date (YYYY-MM-DD) |
| `to` | date | — | Filter to date (YYYY-MM-DD) |
| `bucket` | string | — | Filter by bucket name: `tax`, `operations`, `growth` |

#### Response `200`

```json
{
  "data": [ /* array of allocation records */ ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 143,
    "totalPages": 8
  }
}
```

---

### GET /rules

List all rules for your tenant, sorted by priority ascending (lowest number = evaluated first).

#### Response `200`

```json
{
  "data": [
    {
      "id": "rule_1e3c",
      "name": "GST auto-reserve",
      "trigger": {
        "event": "transaction.received",
        "conditions": [
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
      "priority": 10,
      "enabled": true,
      "createdAt": "2026-04-01T09:00:00Z"
    }
  ],
  "total": 1
}
```

---

### POST /rules

Create a new allocation or risk rule.

Rules are evaluated in `priority` order. The **first matching rule wins** — subsequent rules are skipped for that transaction.

#### Trigger events

| Event | Fires on |
|-------|---------|
| `transaction.received` | Every `POST /transaction/allocate` call |
| `expense.requested` | Every `POST /transaction/assess` call |
| `period.end` | End of month/quarter (for rebalancing) |

#### Action types

| Type | Effect |
|------|--------|
| `allocate` | Override the bucket split percentages |
| `block` | Prevent the transaction from proceeding |
| `flag` | Mark for manual review, don't block |
| `notify` | Send alert to a channel |

#### Condition operators

| Operator | Meaning |
|----------|---------|
| `gt` / `lt` | Greater/less than |
| `gte` / `lte` | Greater/less than or equal |
| `eq` / `neq` | Equal / not equal |
| `contains` | String or array includes value |
| `startsWith` | String starts with value |

#### Request

```json
{
  "name": "GST reserve — large invoices",
  "description": "Auto-reserve 18% GST on every invoice over ₹10,000",
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
  "priority": 10,
  "enabled": true
}
```

#### Response `201`

Returns the created rule with its generated `id` and `createdAt`.

#### Code examples

**Block high-value expenses from new vendors**
```javascript
await client.post('/rules', {
  name: "Block large new-vendor payments",
  trigger: {
    event: "expense.requested",
    conditions: [
      { field: "amount", operator: "gte", value: 50000 },
      { field: "category", operator: "eq", value: "vendor" }
    ]
  },
  action: { type: "block" },
  priority: 5
});
```

**Auto-reserve 20% for payroll quarter**
```javascript
await client.post('/rules', {
  name: "Q4 payroll reserve",
  trigger: {
    event: "transaction.received",
    conditions: [
      { field: "metadata.quarter", operator: "eq", value: "Q4" }
    ]
  },
  action: {
    type: "allocate",
    params: {
      buckets: [
        { bucket: "tax", percentage: 18 },
        { bucket: "operations", percentage: 32 },
        { bucket: "growth", percentage: 30 },
        { bucket: "custom", percentage: 20, reason: "Payroll reserve" }
      ]
    }
  },
  priority: 20
});
```

---

### PUT /rules/:id

Full replacement of a rule. Any field not sent is reset to its default.

```
PUT /rules/rule_1e3c
```

Send the same body as `POST /rules`. Returns the updated rule.

---

### DELETE /rules/:id

Permanently deletes the rule. The system default allocation applies for transactions that previously matched it.

```
DELETE /rules/rule_1e3c
```

Returns `HTTP 204 No Content`.

---

### POST /simulate/allocation

Dry-run `POST /transaction/allocate` — identical logic, nothing persisted, no webhooks fired.

Use this to:
- Show customers what their allocation would look like before going live
- Test a new rule before enabling it
- Build a "what if I received ₹X?" calculator

#### Request

```json
{
  "amount": 200000,
  "currency": "INR",
  "source": "invoice",
  "overrideRules": []
}
```

Pass `overrideRules` with an array of hypothetical rule objects to test them instead of your live rules.

#### Response `200`

```json
{
  "simulated": true,
  "allocations": [
    { "bucket": "tax", "percentage": 18, "amount": 36000 },
    { "bucket": "operations", "percentage": 52, "amount": 104000 },
    { "bucket": "growth", "percentage": 30, "amount": 60000 }
  ],
  "ruleApplied": "system_default"
}
```

---

### POST /simulate/cashflow

Project bucket balances forward N periods given expected inflows and outflows. Supports multiple scenarios.

#### Request

```json
{
  "periods": 12,
  "periodUnit": "month",
  "initialBalances": {
    "tax": 22500,
    "operations": 62500,
    "growth": 40000
  },
  "projectedInflows": [
    { "amount": 125000, "source": "invoice", "frequency": "monthly" }
  ],
  "projectedOutflows": [
    { "amount": 40000, "category": "payroll", "frequency": "monthly" },
    { "amount": 15000, "category": "rent", "frequency": "monthly" }
  ],
  "scenarios": ["base", "downside_20pct"]
}
```

#### Frequency values

`monthly` · `quarterly` · `annual` · `once`

#### Scenario keys

`base` · `upside_20pct` · `downside_20pct` · `downside_40pct`

#### Response `200`

```json
{
  "simulated": true,
  "periods": 12,
  "periodUnit": "month",
  "scenarios": {
    "base": {
      "timeline": [
        {
          "period": "Jan",
          "inflow": 125000,
          "outflow": 55000,
          "net": 70000,
          "balances": { "tax": 45000, "operations": 97500, "growth": 80000 }
        }
      ],
      "riskEvents": []
    },
    "downside_20pct": {
      "timeline": [ /* ... */ ],
      "riskEvents": [
        {
          "period": "Aug",
          "type": "bucket_negative",
          "bucket": "operations",
          "deficit": 12000
        }
      ]
    }
  },
  "summary": {
    "base": { "riskEventCount": 0, "lowestBalance": { "tax": 22500, "operations": 42500 } },
    "downside_20pct": { "riskEventCount": 1, "lowestBalance": { "operations": -12000 } }
  }
}
```

---

### POST /simulate/rule-test

Test a rule definition against sample transactions before saving it. Returns match rate and per-transaction results.

#### Request

```json
{
  "rule": {
    "trigger": {
      "event": "transaction.received",
      "conditions": [
        { "field": "amount", "operator": "gte", "value": 50000 }
      ]
    },
    "action": {
      "type": "allocate",
      "params": { "buckets": [{ "bucket": "tax", "percentage": 20 }] }
    }
  },
  "sampleTransactions": [
    { "amount": 30000, "source": "invoice" },
    { "amount": 80000, "source": "invoice" },
    { "amount": 120000, "source": "transfer" }
  ]
}
```

#### Response `200`

```json
{
  "simulated": true,
  "rule": "unnamed rule",
  "totalSamples": 3,
  "matched": 2,
  "unmatched": 1,
  "matchRate": "66.7%",
  "results": [
    { "transaction": { "amount": 30000 }, "matched": false, "wouldFallToDefault": true },
    { "transaction": { "amount": 80000 }, "matched": true, "action": { "type": "allocate" } },
    { "transaction": { "amount": 120000 }, "matched": true, "action": { "type": "allocate" } }
  ]
}
```

---

### GET /webhooks

List all registered webhooks for your tenant.

```json
{
  "data": [
    {
      "id": "wh_9f2c",
      "url": "https://yourapp.com/webhooks/decision",
      "events": ["transaction.allocated", "risk.flagged"],
      "enabled": true,
      "createdAt": "2026-04-01T09:00:00Z"
    }
  ]
}
```

---

### POST /webhooks

Register a URL to receive push events.

#### Request

```json
{
  "url": "https://yourapp.com/webhooks/decision",
  "events": ["transaction.allocated", "risk.flagged"]
}
```

#### Response `201`

```json
{
  "id": "wh_9f2c",
  "url": "https://yourapp.com/webhooks/decision",
  "events": ["transaction.allocated", "risk.flagged"],
  "secret": "abc123def456...",
  "enabled": true
}
```

> **Save the `secret`.** It is shown only once. Use it to verify incoming webhook signatures.

---

### DELETE /webhooks/:id

Removes the webhook. Returns `HTTP 204 No Content`.

---

### GET /webhooks/:id/deliveries

Returns the delivery log for a webhook — useful for debugging failed events.

#### Query parameters

| Param | Values |
|-------|--------|
| `status` | `delivered` · `failed` · `pending` |

#### Response

```json
{
  "data": [
    {
      "event": "transaction.allocated",
      "attempt": 1,
      "status": 200,
      "success": true,
      "loggedAt": "2026-04-12T10:30:05Z"
    },
    {
      "event": "risk.flagged",
      "attempt": 3,
      "status": 0,
      "success": false,
      "error": "Request timeout",
      "loggedAt": "2026-04-12T10:28:00Z"
    }
  ]
}
```

---

## Data models

### Allocation bucket

```typescript
{
  bucket: "tax" | "operations" | "growth" | "reserve" | "custom"
  percentage: number        // 0–100
  amount: number            // exact amount in currency
  reason: string            // human-readable explanation
}
```

### Rule

```typescript
{
  id: string                // auto-generated: "rule_1e3c"
  name: string
  description?: string
  trigger: {
    event: "transaction.received" | "expense.requested" | "period.end"
    conditions: Array<{
      field: string         // "amount", "currency", "source", "metadata.clientId", ...
      operator: "gt" | "lt" | "gte" | "lte" | "eq" | "neq" | "contains" | "startsWith"
      value: any
    }>
  }
  action: {
    type: "allocate" | "block" | "flag" | "notify"
    params: object          // shape depends on type
  }
  priority: number          // lower = evaluated first
  enabled: boolean
  createdAt: string         // ISO 8601
}
```

### Risk score

```typescript
{
  score: number             // 0.0–1.0
  level: "low" | "medium" | "high" | "critical"
  factors: Array<{
    factor: string          // machine-readable factor name
    weight: number          // contribution to total score
    description: string     // human-readable explanation
  }>
}
```

### Webhook

```typescript
{
  id: string
  url: string
  events: string[]
  secret?: string           // only returned on creation
  enabled: boolean
  createdAt: string
}
```

---

## Code examples

### Complete integration — Razorpay webhook → Decision API

This shows a real-world pattern: when a Razorpay payment webhook arrives, allocate the funds and log the result.

```javascript
// server.js — Node.js + Express
const express = require('express');
const axios = require('axios');
const crypto = require('crypto');

const app = express();
const decisionApi = axios.create({
  baseURL: 'https://api.decisionapi.dev/v1',
  headers: { 'X-API-Key': process.env.DECISION_API_KEY }
});

// Razorpay sends payment events here
app.post('/webhooks/razorpay',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    // 1. Verify Razorpay signature
    const signature = req.headers['x-razorpay-signature'];
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(req.body)
      .digest('hex');
    if (signature !== expected) return res.status(401).send('Invalid');

    const event = JSON.parse(req.body);
    if (event.event !== 'payment.captured') return res.status(200).send('ignored');

    const payment = event.payload.payment.entity;

    // 2. Allocate via Decision API
    try {
      const { data } = await decisionApi.post('/transaction/allocate', {
        transactionId: payment.id,
        amount: payment.amount / 100,  // Razorpay uses paise
        currency: payment.currency,
        source: 'invoice',
        metadata: { orderId: payment.order_id }
      }, {
        headers: { 'X-Idempotency-Key': payment.id }
      });

      console.log(`Allocated ₹${data.totalAmount}:`, data.allocations);
      // 3. Update your DB with the allocation result
      await db.allocations.create({ ...data, paymentId: payment.id });

    } catch (err) {
      console.error('Allocation failed:', err.response?.data);
      // Don't return 500 — Razorpay will retry unnecessarily
    }

    res.status(200).send('ok');
  }
);
```

### Pre-payment risk check — React component

```jsx
// PaymentApproval.jsx
import { useState } from 'react';
import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'X-API-Key': localStorage.getItem('apiKey') }
});

export function PaymentApproval({ payment, onApprove, onReject }) {
  const [risk, setRisk] = useState(null);
  const [loading, setLoading] = useState(false);

  async function assess() {
    setLoading(true);
    const { data } = await api.post('/transaction/assess', {
      amount: payment.amount,
      currency: 'INR',
      category: payment.category,
      vendorId: payment.vendorId,
    });
    setRisk(data);
    setLoading(false);
  }

  const riskColor = {
    low: 'text-green-600',
    medium: 'text-amber-600',
    high: 'text-orange-600',
    critical: 'text-red-600',
  };

  return (
    <div className="p-6 border rounded-lg">
      <h2 className="text-lg font-medium mb-4">Payment: ₹{payment.amount.toLocaleString()}</h2>

      {!risk ? (
        <button onClick={assess} disabled={loading} className="btn-primary">
          {loading ? 'Assessing...' : 'Check risk before approving'}
        </button>
      ) : (
        <div>
          <div className={`text-2xl font-bold ${riskColor[risk.risk.level]}`}>
            {risk.recommendation.toUpperCase()}
          </div>
          <div className="text-sm text-gray-500 mb-4">
            Risk score: {(risk.risk.score * 100).toFixed(0)}/100 · Level: {risk.risk.level}
          </div>

          <ul className="text-sm mb-6 space-y-1">
            {risk.risk.factors.map(f => (
              <li key={f.factor} className="flex gap-2">
                <span className="text-amber-500">!</span>
                <span>{f.description}</span>
              </li>
            ))}
          </ul>

          <div className="flex gap-3">
            {risk.recommendation !== 'block' && (
              <button onClick={onApprove} className="btn-success">Approve payment</button>
            )}
            <button onClick={onReject} className="btn-danger">Reject</button>
          </div>
        </div>
      )}
    </div>
  );
}
```

### Cashflow projection — Python data script

```python
# project_cashflow.py
import os, requests, json

BASE = "https://api.decisionapi.dev/v1"
HEADERS = {"X-API-Key": os.environ["DECISION_API_KEY"]}

def project_next_year(initial_balances: dict) -> dict:
    payload = {
        "periods": 12,
        "periodUnit": "month",
        "initialBalances": initial_balances,
        "projectedInflows": [
            {"amount": 150000, "source": "invoice", "frequency": "monthly"},
            {"amount": 50000, "source": "subscription", "frequency": "monthly"},
        ],
        "projectedOutflows": [
            {"amount": 60000, "category": "payroll", "frequency": "monthly"},
            {"amount": 20000, "category": "rent", "frequency": "monthly"},
            {"amount": 15000, "category": "software", "frequency": "monthly"},
        ],
        "scenarios": ["base", "downside_20pct", "upside_20pct"],
    }

    res = requests.post(f"{BASE}/simulate/cashflow", json=payload, headers=HEADERS)
    res.raise_for_status()
    result = res.json()

    print(f"\n{'Period':<8} {'Base ops':>12} {'Downside ops':>14} {'Upside ops':>12}")
    print("-" * 50)
    for i, period in enumerate(result["scenarios"]["base"]["timeline"]):
        base_ops = period["balances"]["operations"]
        down_ops = result["scenarios"]["downside_20pct"]["timeline"][i]["balances"]["operations"]
        up_ops = result["scenarios"]["upside_20pct"]["timeline"][i]["balances"]["operations"]
        print(f"{period['period']:<8} ₹{base_ops:>10,.0f} ₹{down_ops:>12,.0f} ₹{up_ops:>10,.0f}")

    risk_events = result["scenarios"]["downside_20pct"]["riskEvents"]
    if risk_events:
        print(f"\n⚠ {len(risk_events)} risk event(s) in downside scenario:")
        for e in risk_events:
            print(f"  {e['period']}: {e['type']} — {e.get('bucket', '')}")

    return result

if __name__ == "__main__":
    projection = project_next_year({
        "tax": 22500,
        "operations": 62500,
        "growth": 40000
    })
```

---

## Quickstart guides

### Guide 1 — Set up in 5 minutes (Node.js)

```bash
npm install axios dotenv
```

```
# .env
DECISION_API_KEY=dev-key-001
DECISION_API_BASE=http://localhost:3000/api/v1
```

```javascript
// decisionApi.js
require('dotenv').config();
const axios = require('axios');

const api = axios.create({
  baseURL: process.env.DECISION_API_BASE,
  headers: { 'X-API-Key': process.env.DECISION_API_KEY }
});

// Test it
async function quickstart() {
  // 1. Check health
  const { data: health } = await api.get('/health');
  console.log('API status:', health.status);

  // 2. Allocate a payment
  const { data: alloc } = await api.post('/transaction/allocate', {
    transactionId: 'test_001',
    amount: 100000,
    currency: 'INR',
    source: 'invoice'
  });
  console.log('Allocation:', alloc.allocations);

  // 3. Risk-check a spend
  const { data: risk } = await api.post('/transaction/assess', {
    amount: 20000,
    currency: 'INR',
    category: 'vendor'
  });
  console.log('Spend check:', risk.recommendation, `(${risk.risk.level})`);
}

quickstart();
```

### Guide 2 — Create your first rule

```javascript
const rule = await api.post('/rules', {
  name: 'Consulting invoice — high GST reserve',
  trigger: {
    event: 'transaction.received',
    conditions: [
      { field: 'source', operator: 'eq', value: 'invoice' },
      { field: 'metadata.category', operator: 'eq', value: 'consulting' }
    ]
  },
  action: {
    type: 'allocate',
    params: {
      buckets: [
        { bucket: 'tax', percentage: 22 },
        { bucket: 'operations', percentage: 48 },
        { bucket: 'growth', percentage: 30 }
      ]
    }
  },
  priority: 10
});
console.log('Rule created:', rule.data.id);

// Test it before going live
const test = await api.post('/simulate/rule-test', {
  rule: rule.data,
  sampleTransactions: [
    { amount: 50000, source: 'invoice', metadata: { category: 'consulting' } },
    { amount: 80000, source: 'invoice', metadata: { category: 'product' } },
    { amount: 30000, source: 'transfer', metadata: {} }
  ]
});
console.log(`Rule matches ${test.data.matchRate} of sample transactions`);
```

### Guide 3 — Embed in a fintech platform

```javascript
// TenantClient.js — wrap per-tenant API access
class DecisionApiClient {
  constructor(apiKey) {
    this.client = axios.create({
      baseURL: 'https://api.decisionapi.dev/v1',
      headers: { 'X-API-Key': apiKey }
    });
  }

  async onPaymentReceived(payment) {
    return this.client.post('/transaction/allocate', {
      transactionId: payment.id,
      amount: payment.amount,
      currency: payment.currency,
      source: payment.type,
      metadata: payment.meta
    }, {
      headers: { 'X-Idempotency-Key': payment.id }
    });
  }

  async onPaymentRequested(expense) {
    const { data } = await this.client.post('/transaction/assess', {
      amount: expense.amount,
      currency: expense.currency,
      category: expense.category,
    });
    return data.recommendation; // 'approve' | 'review' | 'block'
  }
}

// Usage
const tenant = new DecisionApiClient(req.tenant.apiKey);
const recommendation = await tenant.onPaymentRequested(expense);
```

---

## FAQ

**Q: What currency formats are supported?**
Use ISO 4217 three-letter codes: `INR`, `USD`, `EUR`, `GBP`, `SGD`. Amounts should be in the major unit (rupees, not paise).

**Q: Can I create custom buckets beyond tax/operations/growth?**
Yes. In your rule's action params, use `"bucket": "custom"` and give it a `reason`. Custom buckets appear in the allocation response and are tracked separately.

**Q: What happens if my rule's percentages don't add up to 100?**
The engine normalizes them automatically. If you specify tax=18 and ops=52, the remaining 30 goes to growth by default. If you specify more than 100, each bucket is scaled down proportionally.

**Q: Is the simulation endpoint free?**
Simulation endpoints (`/simulate/*`) don't count toward your rate limit quota. Run as many simulations as needed.

**Q: How do I migrate from the in-memory store to Postgres?**
Only the repository files need to change (`src/models/*.js`). All service and controller logic is database-agnostic. Swap the Map-based implementations for `pg` or Prisma queries — the method signatures stay identical.

**Q: Do webhook deliveries block my API response?**
No. Webhook dispatch is fire-and-forget. The `POST /transaction/allocate` response is returned immediately — webhook delivery happens asynchronously in the background.

**Q: What's the maximum rule priority number?**
There's no maximum. The only constraint is that rules are evaluated in ascending priority order. Use increments of 10 (10, 20, 30...) so you have room to insert rules between existing ones without renumbering.
