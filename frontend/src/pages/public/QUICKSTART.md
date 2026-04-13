# Decision API — Quickstart Guide

> **Get from zero to your first allocation in under 5 minutes**

This guide walks you through the five essential steps to start using the Decision API: allocating incoming payments, assessing spending risk, creating custom rules, testing them, and setting up webhooks for real-time events.

---

## Prerequisites

- An API key (use `dev-key-001` for local development)
- A terminal with `curl`, or Node.js/Python installed
- Base URL: `http://localhost:3000/api/v1` (local) or `https://api.decisionapi.dev/v1` (production)

---

## Step 1: Check API Health

Verify the API is running before proceeding.

### cURL
```bash
curl http://localhost:3000/api/v1/health
```

### Node.js
```javascript
const axios = require('axios');

async function checkHealth() {
  const res = await axios.get('http://localhost:3000/api/v1/health');
  console.log('API Status:', res.data.status);
  console.log('Version:', res.data.version);
}

checkHealth();
```

### Python
```python
import requests

res = requests.get('http://localhost:3000/api/v1/health')
print(f"Status: {res.json()['status']}")
print(f"Version: {res.json()['version']}")
```

**Expected response:**
```json
{
  "status": "ok",
  "version": "1.0.0",
  "uptime": 3600,
  "timestamp": "2026-04-12T10:30:00Z"
}
```

---

## Step 2: Allocate Your First Payment

Every time money arrives (invoice payment, transfer, subscription), call `/transaction/allocate` to split it across buckets.

### cURL
```bash
curl -X POST http://localhost:3000/api/v1/transaction/allocate \
  -H "X-API-Key: dev-key-001" \
  -H "Content-Type: application/json" \
  -d '{
    "transactionId": "txn_001",
    "amount": 125000,
    "currency": "INR",
    "source": "invoice"
  }'
```

### Node.js
```javascript
const axios = require('axios');

const api = axios.create({
  baseURL: 'http://localhost:3000/api/v1',
  headers: { 'X-API-Key': 'dev-key-001' }
});

async function allocatePayment() {
  const res = await api.post('/transaction/allocate', {
    transactionId: 'txn_001',
    amount: 125000,
    currency: 'INR',
    source: 'invoice'
  });

  const data = res.data;
  console.log(`\nAllocated ₹${data.totalAmount}:`);
  data.allocations.forEach(a => {
    console.log(`  ${a.bucket}: ₹${a.amount} (${a.percentage}%)`);
  });
}

allocatePayment();
```

### Python
```python
import requests

HEADERS = {'X-API-Key': 'dev-key-001'}
BASE = 'http://localhost:3000/api/v1'

res = requests.post(f'{BASE}/transaction/allocate', json={
    'transactionId': 'txn_001',
    'amount': 125000,
    'currency': 'INR',
    'source': 'invoice'
}, headers=HEADERS)

data = res.json()
print(f"\nAllocated ₹{data['totalAmount']}:")
for a in data['allocations']:
    print(f"  {a['bucket']}: ₹{a['amount']} ({a['percentage']}%)")
```

**Expected response:**
```json
{
  "allocationId": "alloc_9f2c1d",
  "transactionId": "txn_001",
  "totalAmount": 125000,
  "currency": "INR",
  "allocations": [
    { "bucket": "tax", "percentage": 18, "amount": 22500, "reason": "GST reserve at 18%" },
    { "bucket": "operations", "percentage": 52, "amount": 65000, "reason": "Operational float" },
    { "bucket": "growth", "percentage": 30, "amount": 37500, "reason": "Remaining to growth capital" }
  ],
  "ruleApplied": "system_default",
  "processedAt": "2026-04-12T10:30:00Z"
}
```

---

## Step 3: Assess Spending Risk

Before approving any expense, call `/transaction/assess` to get a risk score and recommendation.

### cURL
```bash
curl -X POST http://localhost:3000/api/v1/transaction/assess \
  -H "X-API-Key: dev-key-001" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 45000,
    "currency": "INR",
    "category": "vendor",
    "vendorId": "vendor_acme"
  }'
```

### Node.js
```javascript
async function assessExpense() {
  const res = await api.post('/transaction/assess', {
    amount: 45000,
    currency: 'INR',
    category: 'vendor',
    vendorId: 'vendor_acme'
  });

  const data = res.data;
  console.log(`\nRecommendation: ${data.recommendation.toUpperCase()}`);
  console.log(`Risk Score: ${(data.risk.score * 100).toFixed(0)}/100 (${data.risk.level})`);
  
  if (data.risk.factors.length > 0) {
    console.log('\nRisk Factors:');
    data.risk.factors.forEach(f => console.log(`  • ${f.description}`));
  }
}

assessExpense();
```

### Python
```python
res = requests.post(f'{BASE}/transaction/assess', json={
    'amount': 45000,
    'currency': 'INR',
    'category': 'vendor',
    'vendorId': 'vendor_acme'
}, headers=HEADERS)

data = res.json()
print(f"\nRecommendation: {data['recommendation'].upper()}")
print(f"Risk Score: {data['risk']['score']*100:.0f}/100 ({data['risk']['level']})")

if data['risk']['factors']:
    print("\nRisk Factors:")
    for f in data['risk']['factors']:
        print(f"  • {f['description']}")
```

**Expected response:**
```json
{
  "assessmentId": "asmt_3b7f9a",
  "recommendation": "review",
  "risk": {
    "score": 0.67,
    "level": "medium",
    "factors": [
      { "factor": "large_single_expense", "weight": 0.3, "description": "Expense exceeds 40% of monthly average" }
    ]
  },
  "currentBucketBalances": {
    "operations": { "balance": 65000, "percentage": 52 },
    "tax": { "balance": 22500, "percentage": 18 },
    "growth": { "balance": 37500, "percentage": 30 }
  },
  "assessedAt": "2026-04-12T10:31:00Z"
}
```

**Interpret the recommendation:**
- `approve` → Auto-proceed with payment
- `review` → Show risk details to decision-maker
- `block` → Prevent payment entirely

---

## Step 4: Create & Test a Custom Rule

Define your own allocation logic. Rules are evaluated in priority order (lowest number first).

### Create a rule for large invoices

#### cURL
```bash
curl -X POST http://localhost:3000/api/v1/rules \
  -H "X-API-Key: dev-key-001" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Large invoice GST reserve",
    "description": "Auto-reserve 20% tax on invoices over ₹50,000",
    "trigger": {
      "event": "transaction.received",
      "conditions": [
        { "field": "amount", "operator": "gte", "value": 50000 },
        { "field": "source", "operator": "eq", "value": "invoice" }
      ]
    },
    "action": {
      "type": "allocate",
      "params": {
        "buckets": [
          { "bucket": "tax", "percentage": 20 },
          { "bucket": "operations", "percentage": 50 },
          { "bucket": "growth", "percentage": 30 }
        ]
      }
    },
    "priority": 10,
    "enabled": true
  }'
```

#### Node.js
```javascript
async function createRule() {
  const res = await api.post('/rules', {
    name: 'Large invoice GST reserve',
    description: 'Auto-reserve 20% tax on invoices over ₹50,000',
    trigger: {
      event: 'transaction.received',
      conditions: [
        { field: 'amount', operator: 'gte', value: 50000 },
        { field: 'source', operator: 'eq', value: 'invoice' }
      ]
    },
    action: {
      type: 'allocate',
      params: {
        buckets: [
          { bucket: 'tax', percentage: 20 },
          { bucket: 'operations', percentage: 50 },
          { bucket: 'growth', percentage: 30 }
        ]
      }
    },
    priority: 10,
    enabled: true
  });

  console.log('Rule created:', res.data.id);
  return res.data;
}

createRule();
```

#### Python
```python
res = requests.post(f'{BASE}/rules', json={
    'name': 'Large invoice GST reserve',
    'description': 'Auto-reserve 20% tax on invoices over ₹50,000',
    'trigger': {
        'event': 'transaction.received',
        'conditions': [
            { 'field': 'amount', 'operator': 'gte', 'value': 50000 },
            { 'field': 'source', 'operator': 'eq', 'value': 'invoice' }
        ]
    },
    'action': {
        'type': 'allocate',
        'params': {
            'buckets': [
                { 'bucket': 'tax', 'percentage': 20 },
                { 'bucket': 'operations', 'percentage': 50 },
                { 'bucket': 'growth', 'percentage': 30 }
            ]
        }
    },
    'priority': 10,
    'enabled': True
}, headers=HEADERS)

print('Rule created:', res.json()['id'])
rule = res.json()
```

### Test the rule before enabling

Use `/simulate/rule-test` to see which transactions would match.

#### cURL
```bash
curl -X POST http://localhost:3000/api/v1/simulate/rule-test \
  -H "X-API-Key: dev-key-001" \
  -H "Content-Type: application/json" \
  -d '{
    "rule": {
      "trigger": {
        "event": "transaction.received",
        "conditions": [
          { "field": "amount", "operator": "gte", "value": 50000 },
          { "field": "source", "operator": "eq", "value": "invoice" }
        ]
      },
      "action": {
        "type": "allocate",
        "params": {
          "buckets": [
            { "bucket": "tax", "percentage": 20 },
            { "bucket": "operations", "percentage": 50 },
            { "bucket": "growth", "percentage": 30 }
          ]
        }
      }
    },
    "sampleTransactions": [
      { "amount": 30000, "source": "invoice" },
      { "amount": 80000, "source": "invoice" },
      { "amount": 120000, "source": "transfer" }
    ]
  }'
```

#### Node.js
```javascript
async function testRule(rule) {
  const res = await api.post('/simulate/rule-test', {
    rule: rule,
    sampleTransactions: [
      { amount: 30000, source: 'invoice' },
      { amount: 80000, source: 'invoice' },
      { amount: 120000, source: 'transfer' }
    ]
  });

  const data = res.data;
  console.log(`\nRule test results:`);
  console.log(`  Matched: ${data.matched}/${data.totalSamples} (${data.matchRate})`);
  
  data.results.forEach(r => {
    const status = r.matched ? '✓ MATCH' : '✗ no match';
    console.log(`  ${status}: ₹${r.transaction.amount} ${r.transaction.source}`);
  });
}

// After creating the rule:
const rule = await createRule();
await testRule(rule);
```

#### Python
```python
test_res = requests.post(f'{BASE}/simulate/rule-test', json={
    'rule': rule,
    'sampleTransactions': [
        { 'amount': 30000, 'source': 'invoice' },
        { 'amount': 80000, 'source': 'invoice' },
        { 'amount': 120000, 'source': 'transfer' }
    ]
}, headers=HEADERS)

data = test_res.json()
print(f"\nRule test results:")
print(f"  Matched: {data['matched']}/{data['totalSamples']} ({data['matchRate']})")

for r in data['results']:
    status = '✓ MATCH' if r['matched'] else '✗ no match'
    print(f"  {status}: ₹{r['transaction']['amount']} {r['transaction']['source']}")
```

**Expected output:**
```
Rule test results:
  Matched: 2/3 (66.7%)
  ✗ no match: ₹30000 invoice
  ✓ MATCH: ₹80000 invoice
  ✗ no match: ₹120000 transfer
```

---

## Step 5: Set Up Webhooks

Receive real-time events instead of polling. Register a webhook URL to get notified on allocations, risk flags, and rule triggers.

### Register a webhook

#### cURL
```bash
curl -X POST http://localhost:3000/api/v1/webhooks \
  -H "X-API-Key: dev-key-001" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://yourapp.com/webhooks/decision",
    "events": ["transaction.allocated", "risk.flagged"]
  }'
```

#### Node.js
```javascript
async function registerWebhook() {
  const res = await api.post('/webhooks', {
    url: 'https://yourapp.com/webhooks/decision',
    events: ['transaction.allocated', 'risk.flagged']
  });

  const data = res.data;
  console.log('\nWebhook registered:');
  console.log(`  ID: ${data.id}`);
  console.log(`  URL: ${data.url}`);
  console.log(`  Secret: ${data.secret}`);
  console.log('\n⚠ Save the secret! It is shown only once.');
  
  return data;
}

registerWebhook();
```

#### Python
```python
res = requests.post(f'{BASE}/webhooks', json={
    'url': 'https://yourapp.com/webhooks/decision',
    'events': ['transaction.allocated', 'risk.flagged']
}, headers=HEADERS)

data = res.json()
print('\nWebhook registered:')
print(f"  ID: {data['id']}")
print(f"  URL: {data['url']}")
print(f"  Secret: {data['secret']}")
print('\n⚠ Save the secret! It is shown only once.')
```

**Response:**
```json
{
  "id": "wh_9f2c",
  "url": "https://yourapp.com/webhooks/decision",
  "events": ["transaction.allocated", "risk.flagged"],
  "secret": "abc123def456...",
  "enabled": true
}
```

### Verify webhook signatures (Node.js example)

Always verify the `X-Decision-Signature` header before processing events.

```javascript
const crypto = require('crypto');
const express = require('express');

const app = express();
const WEBHOOK_SECRET = 'abc123def456...'; // Save this from registration

function verifySignature(req, secret) {
  const signature = req.headers['x-decision-signature'];
  const expected = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(req.rawBody)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

app.post('/webhooks/decision', express.raw({ type: 'application/json' }), (req, res) => {
  if (!verifySignature(req, WEBHOOK_SECRET)) {
    return res.status(401).send('Invalid signature');
  }
  
  const event = JSON.parse(req.body);
  console.log(`Received event: ${event.event}`);
  
  // Handle different event types
  switch (event.event) {
    case 'transaction.allocated':
      console.log(`Allocated ₹${event.data.totalAmount}`);
      break;
    case 'risk.flagged':
      console.log(`Risk flagged: ${event.data.recommendation}`);
      break;
  }
  
  res.status(200).send('ok');
});

app.listen(3001, () => console.log('Webhook listener on port 3001'));
```

### List your webhooks

```bash
curl http://localhost:3000/api/v1/webhooks \
  -H "X-API-Key: dev-key-001"
```

---

## Next Steps

You've completed the quickstart! Here's what to explore next:

1. **Read the full API documentation** → See all endpoints, error codes, and advanced features
2. **Try simulation endpoints** → Test cashflow projections and scenario planning
3. **Build custom rules** → Create rules for payroll reserves, client-specific splits, or seasonal adjustments
4. **Integrate with your payment gateway** → Connect Razorpay, Stripe, or bank webhooks to auto-allocate
5. **Embed risk assessment** → Add pre-payment checks to your expense approval workflow

---

## Complete Example: All-in-One Script

### Node.js — Run all 5 steps in sequence

```javascript
// quickstart.js
const axios = require('axios');

const BASE = 'http://localhost:3000/api/v1';
const API_KEY = 'dev-key-001';

const api = axios.create({
  baseURL: BASE,
  headers: { 'X-API-Key': API_KEY }
});

async function runQuickstart() {
  console.log('🚀 Decision API Quickstart\n');
  
  // Step 1: Health check
  console.log('Step 1: Checking API health...');
  const health = await api.get('/health');
  console.log(`✓ API ${health.data.status} (v${health.data.version})\n`);
  
  // Step 2: Allocate payment
  console.log('Step 2: Allocating payment...');
  const alloc = await api.post('/transaction/allocate', {
    transactionId: 'txn_quickstart_001',
    amount: 125000,
    currency: 'INR',
    source: 'invoice'
  });
  console.log(`✓ Allocated ₹${alloc.data.totalAmount}:`);
  alloc.data.allocations.forEach(a => {
    console.log(`    ${a.bucket}: ₹${a.amount} (${a.percentage}%)`);
  });
  console.log();
  
  // Step 3: Assess expense
  console.log('Step 3: Assessing expense risk...');
  const assess = await api.post('/transaction/assess', {
    amount: 45000,
    currency: 'INR',
    category: 'vendor'
  });
  console.log(`✓ Recommendation: ${assess.data.recommendation.toUpperCase()}`);
  console.log(`  Risk: ${(assess.data.risk.score*100).toFixed(0)}/100 (${assess.data.risk.level})\n`);
  
  // Step 4: Create & test rule
  console.log('Step 4: Creating custom rule...');
  const rule = await api.post('/rules', {
    name: 'Quickstart test rule',
    trigger: {
      event: 'transaction.received',
      conditions: [
        { field: 'amount', operator: 'gte', value: 50000 },
        { field: 'source', operator: 'eq', value: 'invoice' }
      ]
    },
    action: {
      type: 'allocate',
      params: {
        buckets: [
          { bucket: 'tax', percentage: 20 },
          { bucket: 'operations', percentage: 50 },
          { bucket: 'growth', percentage: 30 }
        ]
      }
    },
    priority: 10,
    enabled: true
  });
  console.log(`✓ Rule created: ${rule.data.id}`);
  
  console.log('\nTesting rule against sample transactions...');
  const test = await api.post('/simulate/rule-test', {
    rule: rule.data,
    sampleTransactions: [
      { amount: 30000, source: 'invoice' },
      { amount: 80000, source: 'invoice' },
      { amount: 120000, source: 'transfer' }
    ]
  });
  console.log(`✓ Match rate: ${test.data.matchRate}\n`);
  
  // Step 5: Register webhook
  console.log('Step 5: Registering webhook...');
  const webhook = await api.post('/webhooks', {
    url: 'https://yourapp.com/webhooks/decision',
    events: ['transaction.allocated', 'risk.flagged']
  });
  console.log(`✓ Webhook registered: ${webhook.data.id}`);
  console.log(`  Secret: ${webhook.data.secret}\n`);
  
  console.log('🎉 Quickstart complete! You\'re ready to build.');
}

runQuickstart().catch(err => {
  console.error('Error:', err.response?.data || err.message);
  process.exit(1);
});
```

Run with:
```bash
node quickstart.js
```

### Python — All-in-One Script

```python
# quickstart.py
import requests
import sys

BASE = 'http://localhost:3000/api/v1'
API_KEY = 'dev-key-001'
HEADERS = {'X-API-Key': API_KEY}

def run_quickstart():
    print('🚀 Decision API Quickstart\n')
    
    # Step 1: Health check
    print('Step 1: Checking API health...')
    res = requests.get(f'{BASE}/health')
    data = res.json()
    print(f"✓ API {data['status']} (v{data['version']})\n")
    
    # Step 2: Allocate payment
    print('Step 2: Allocating payment...')
    res = requests.post(f'{BASE}/transaction/allocate', json={
        'transactionId': 'txn_quickstart_001',
        'amount': 125000,
        'currency': 'INR',
        'source': 'invoice'
    }, headers=HEADERS)
    data = res.json()
    print(f"✓ Allocated ₹{data['totalAmount']}:")
    for a in data['allocations']:
        print(f"    {a['bucket']}: ₹{a['amount']} ({a['percentage']}%)")
    print()
    
    # Step 3: Assess expense
    print('Step 3: Assessing expense risk...')
    res = requests.post(f'{BASE}/transaction/assess', json={
        'amount': 45000,
        'currency': 'INR',
        'category': 'vendor'
    }, headers=HEADERS)
    data = res.json()
    print(f"✓ Recommendation: {data['recommendation'].upper()}")
    print(f"  Risk: {data['risk']['score']*100:.0f}/100 ({data['risk']['level']})\n")
    
    # Step 4: Create & test rule
    print('Step 4: Creating custom rule...')
    res = requests.post(f'{BASE}/rules', json={
        'name': 'Quickstart test rule',
        'trigger': {
            'event': 'transaction.received',
            'conditions': [
                { 'field': 'amount', 'operator': 'gte', 'value': 50000 },
                { 'field': 'source', 'operator': 'eq', 'value': 'invoice' }
            ]
        },
        'action': {
            'type': 'allocate',
            'params': {
                'buckets': [
                    { 'bucket': 'tax', 'percentage': 20 },
                    { 'bucket': 'operations', 'percentage': 50 },
                    { 'bucket': 'growth', 'percentage': 30 }
                ]
            }
        },
        'priority': 10,
        'enabled': True
    }, headers=HEADERS)
    rule = res.json()
    print(f"✓ Rule created: {rule['id']}")
    
    print('\nTesting rule against sample transactions...')
    res = requests.post(f'{BASE}/simulate/rule-test', json={
        'rule': rule,
        'sampleTransactions': [
            { 'amount': 30000, 'source': 'invoice' },
            { 'amount': 80000, 'source': 'invoice' },
            { 'amount': 120000, 'source': 'transfer' }
        ]
    }, headers=HEADERS)
    data = res.json()
    print(f"✓ Match rate: {data['matchRate']}\n")
    
    # Step 5: Register webhook
    print('Step 5: Registering webhook...')
    res = requests.post(f'{BASE}/webhooks', json={
        'url': 'https://yourapp.com/webhooks/decision',
        'events': ['transaction.allocated', 'risk.flagged']
    }, headers=HEADERS)
    data = res.json()
    print(f"✓ Webhook registered: {data['id']}")
    print(f"  Secret: {data['secret']}\n")
    
    print('🎉 Quickstart complete! You\'re ready to build.')

if __name__ == '__main__':
    try:
        run_quickstart()
    except requests.HTTPError as e:
        print(f'Error: {e.response.json().get("error", {})}')
        sys.exit(1)
```

Run with:
```bash
python quickstart.py
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `UNAUTHORIZED` error | Check that `X-API-Key` header is set correctly |
| Connection refused | Ensure the API server is running on port 3000 |
| Webhook not receiving events | Verify your endpoint returns HTTP 200 and check firewall rules |
| Rule not matching | Use `/simulate/rule-test` to debug condition logic |
| Percentages don't sum to 100 | The API normalizes automatically; remaining % goes to growth |

---

**Need help?** See the full [API Documentation](./API_DOCUMENTATION.md) for detailed endpoint references, error handling, and advanced integration patterns.
