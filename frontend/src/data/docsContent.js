/**
 * TaxFlow Documentation Content
 * All endpoint data, examples, and schema definitions
 */

export const docSections = [
  {
    id: 'overview',
    title: 'Overview',
    group: 'Overview',
    content: {
      title: 'TaxFlow',
      subtitle: 'Embedded financial intelligence for SMBs',
      sections: [
        {
          heading: 'Introduction',
          content: `The TaxFlow is an embedded financial intelligence layer for small and medium businesses. It sits between money flowing in and money going out — every transaction is automatically allocated across fund buckets (tax, operations, growth capital) and every proposed spend is risk-assessed before it leaves.`
        },
        {
          heading: 'The core problem',
          content: `Most SMBs mix all funds in a single account and make spending decisions without understanding their future obligations. The TaxFlow prevents this by:

• Automatically splitting every incoming payment the moment it arrives
• Scoring every proposed expense against current balances and historical patterns
• Letting businesses define their own allocation rules
• Providing simulation tools to test scenarios before committing real money`
        },
        {
          heading: 'Who it\'s for',
          content: `• Small and medium businesses wanting automated financial discipline
• Fintech platforms wanting to embed intelligent allocation into their product
• Developers building financial tooling on top of transaction data`
        },
        {
          heading: 'How it works',
          content: `1. Money arrives → POST /transaction/allocate → Returns split: tax 18%, ops 52%, growth 30%
2. Before spending → POST /transaction/assess → Returns risk score + approve/review/block
3. Define your logic → POST /rules → Rules override defaults on every transaction
4. Test before going live → POST /simulate/* → Dry-run with no side effects
5. Get push events → Register webhook → Receive real-time events on allocations, flags

The API is stateless per request. Every call returns a complete decision — you don't need to poll.`
        }
      ]
    }
  },
  {
    id: 'authentication',
    title: 'Authentication',
    group: 'Authentication',
    content: {
      title: 'Authentication',
      sections: [
        {
          heading: 'Overview',
          content: `All endpoints except GET /health require an API key passed in the X-API-Key header.`
        },
        {
          heading: 'Request header',
          codeExample: {
            language: 'http',
            code: `X-API-Key: your_api_key_here`
          }
        },
        {
          heading: 'Development keys',
          content: `Two keys work against the local dev server out of the box:

| Key | Tenant |
|-----|--------|
| \`dev-key-001\` | Acme Corp (starter plan) |
| \`dev-key-002\` | Beta Foods (growth plan) |`
        },
        {
          heading: 'Axios interceptor setup',
          codeExample: {
            language: 'javascript',
            code: `const api = axios.create({
  baseURL: 'https://api.decisionapi.dev/v1',
});

// Add API key to every request
api.interceptors.request.use(config => {
  config.headers['X-API-Key'] = localStorage.getItem('apiKey') || 'dev-key-001';
  return config;
});

// Handle 401 responses
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Redirect to login or show auth error
      console.error('Invalid API key');
    }
    return Promise.reject(error);
  }
);`
          }
        },
        {
          heading: 'Invalid key response',
          codeExample: {
            language: 'json',
            code: `{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid API key"
  }
}`
          }
        }
      ]
    }
  },
  {
    id: 'errors',
    title: 'Errors',
    group: 'Overview',
    content: {
      title: 'Error Handling',
      sections: [
        {
          heading: 'Error format',
          content: `All errors return a consistent JSON envelope. Never parse the HTTP status code alone — always check \`error.code\` for machine-readable handling.`
        },
        {
          heading: 'Error shape',
          codeExample: {
            language: 'json',
            code: `{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "amount must be a positive number",
    "details": [
      { "field": "amount", "message": "must be greater than 0" }
    ]
  }
}`
          }
        },
        {
          heading: 'Error codes',
          table: {
            headers: ['HTTP', 'Code', 'Meaning'],
            rows: [
              ['400', 'VALIDATION_ERROR', 'Request body failed schema validation'],
              ['401', 'UNAUTHORIZED', 'Missing or invalid API key'],
              ['404', 'NOT_FOUND', 'Resource (rule, webhook) not found'],
              ['429', 'RATE_LIMIT_EXCEEDED', 'Too many requests'],
              ['500', 'INTERNAL_ERROR', 'Unexpected server error']
            ]
          }
        },
        {
          heading: 'Handling errors in code',
          codeExample: {
            language: 'javascript',
            code: `try {
  const res = await axios.post('/transaction/allocate', payload);
  return res.data;
} catch (err) {
  const { code, message } = err.response.data.error;
  
  if (code === 'VALIDATION_ERROR') {
    // Show field-level errors to user
    console.log(err.response.data.error.details);
  } else if (code === 'RATE_LIMIT_EXCEEDED') {
    // Back off and retry with exponential backoff
    await sleep(1000);
  } else if (code === 'UNAUTHORIZED') {
    // Redirect to auth
  }
}`
          }
        },
        {
          heading: 'Python example',
          codeExample: {
            language: 'python',
            code: `import requests

try:
    res = requests.post(f"{BASE}/transaction/allocate", json=payload, headers=headers)
    res.raise_for_status()
    return res.json()
except requests.HTTPError as e:
    error = e.response.json()["error"]
    print(f"Error {error['code']}: {error['message']}")`
          }
        }
      ]
    }
  },
  {
    id: 'rate-limiting',
    title: 'Rate Limiting',
    group: 'Overview',
    content: {
      title: 'Rate Limiting',
      sections: [
        {
          heading: 'Overview',
          content: `Limits are applied per tenant (per API key), not per IP.`
        },
        {
          heading: 'Limits by plan',
          table: {
            headers: ['Plan', 'Requests per minute'],
            rows: [
              ['Starter', '60'],
              ['Growth', '300'],
              ['Enterprise', 'Custom']
            ]
          }
        },
        {
          heading: 'Rate limit headers',
          content: `Every response includes:

\`\`\`
RateLimit-Limit: 60
RateLimit-Remaining: 47
RateLimit-Reset: 1713000060
\`\`\`

When the limit is hit you receive HTTP 429. Implement exponential backoff: wait 1s, then 2s, then 4s before retrying.`
        },
        {
          heading: 'Retry with backoff',
          codeExample: {
            language: 'javascript',
            code: `async function requestWithRetry(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (err.response?.status === 429) {
        const retryAfter = err.response.headers['retry-after'] || Math.pow(2, i);
        await sleep(retryAfter * 1000);
      } else {
        throw err;
      }
    }
  }
}`
          }
        }
      ]
    }
  },
  {
    id: 'health',
    title: 'Health',
    group: 'Overview',
    content: {
      title: 'GET /health',
      method: 'GET',
      path: '/health',
      description: 'Check API status. No authentication required.',
      responseExample: {
        status: 'ok',
        version: '1.0.0',
        uptime: 3600,
        timestamp: '2026-04-12T10:30:00Z'
      },
      codeExamples: {
        curl: `curl https://api.decisionapi.dev/v1/health`,
        nodejs: `const { data } = await client.get('/health');
console.log('API status:', data.status);`,
        python: `res = requests.get(f"{BASE}/health")
print(res.json())`,
        go: `req, _ := http.NewRequest("GET", BASE+"/health", nil)
resp, err := http.DefaultClient.Do(req)`
      }
    }
  },
  {
    id: 'transactions/allocate',
    title: 'Allocate',
    group: 'Transactions',
    content: {
      title: 'POST /transaction/allocate',
      method: 'POST',
      path: '/transaction/allocate',
      description: 'The core endpoint. Call this every time money arrives — an invoice is paid, a transfer lands, a subscription renews. Returns a complete allocation decision across tax, operations, and growth buckets.',
      requestBody: {
        fields: [
          { name: 'transactionId', type: 'string', required: true, description: 'Your internal or bank-issued transaction ID' },
          { name: 'amount', type: 'number', required: true, description: 'Positive decimal amount in the smallest meaningful unit (e.g. rupees, not paise)' },
          { name: 'currency', type: 'string', required: true, description: 'ISO 4217 code — INR, USD, EUR' },
          { name: 'source', type: 'string', required: true, description: 'invoice | transfer | subscription | refund | other' },
          { name: 'metadata', type: 'object', required: false, description: 'Any extra data your rules reference (clientId, productLine, etc.)' }
        ]
      },
      responseExample: {
        allocationId: 'alloc_9f2c1d',
        transactionId: 'txn_rzp_abc123',
        totalAmount: 125000,
        currency: 'INR',
        allocations: [
          { bucket: 'tax', percentage: 18, amount: 22500, reason: 'GST reserve at 18%' },
          { bucket: 'operations', percentage: 52, amount: 65000, reason: 'Operational float' },
          { bucket: 'growth', percentage: 30, amount: 37500, reason: 'Growth capital' }
        ],
        ruleApplied: 'GST auto-reserve',
        processedAt: '2026-04-12T10:30:00Z'
      },
      codeExamples: {
        curl: `curl -X POST https://api.decisionapi.dev/v1/transaction/allocate \\
  -H "X-API-Key: dev-key-001" \\
  -H "X-Idempotency-Key: txn_rzp_abc123" \\
  -H "Content-Type: application/json" \\
  -d '{"transactionId":"txn_rzp_abc123","amount":125000,"currency":"INR","source":"invoice"}'`,
        nodejs: `const { data } = await client.post('/transaction/allocate', {
  transactionId: 'txn_rzp_abc123',
  amount: 125000,
  currency: 'INR',
  source: 'invoice',
}, { 
  headers: { 'X-Idempotency-Key': 'txn_rzp_abc123' } 
});

console.log('Allocated:', data.allocations);`,
        python: `res = requests.post(f"{BASE}/transaction/allocate", json={
    "transactionId": "txn_rzp_abc123",
    "amount": 125000,
    "currency": "INR",
    "source": "invoice",
}, headers={**HEADERS, "X-Idempotency-Key": "txn_rzp_abc123"})

result = res.json()
print(f"Allocated ₹{result['totalAmount']}")`,
        go: `body, _ := json.Marshal(map[string]interface{}{
    "transactionId": "txn_rzp_abc123",
    "amount": 125000,
    "currency": "INR",
    "source": "invoice",
})

req, _ := http.NewRequest("POST", BASE+"/transaction/allocate", bytes.NewBuffer(body))
req.Header.Set("X-API-Key", apiKey)
req.Header.Set("X-Idempotency-Key", "txn_rzp_abc123")

resp, err := http.DefaultClient.Do(req)`
      }
    }
  },
  {
    id: 'transactions/assess',
    title: 'Assess',
    group: 'Transactions',
    content: {
      title: 'POST /transaction/assess',
      method: 'POST',
      path: '/transaction/assess',
      description: 'Pre-spend risk gate. Returns a 0–1 risk score, level, and approve/review/block recommendation before money leaves your account.',
      requestBody: {
        fields: [
          { name: 'amount', type: 'number', required: true, description: 'Proposed spend amount' },
          { name: 'currency', type: 'string', required: true, description: 'ISO 4217 code' },
          { name: 'category', type: 'string', required: true, description: 'payroll | vendor | rent | software | marketing | capex | other' },
          { name: 'vendorId', type: 'string', required: false, description: 'Used to look up vendor-level risk history' },
          { name: 'metadata', type: 'object', required: false, description: 'Any additional context' }
        ]
      },
      responseExample: {
        assessmentId: 'asmt_3b7f9a',
        recommendation: 'review',
        risk: {
          score: 0.67,
          level: 'medium',
          factors: [
            { factor: 'large_single_expense', weight: 0.3, description: 'Exceeds 40% of monthly average' },
            { factor: 'low_ops_balance', weight: 0.37, description: 'Operations bucket below 30% threshold' }
          ]
        },
        currentBucketBalances: {
          operations: { balance: 13750, percentage: 22 },
          tax: { balance: 22500, percentage: 100 }
        },
        assessedAt: '2026-04-12T10:31:00Z'
      },
      codeExamples: {
        curl: `curl -X POST https://api.decisionapi.dev/v1/transaction/assess \\
  -H "X-API-Key: dev-key-001" \\
  -H "Content-Type: application/json" \\
  -d '{"amount":45000,"currency":"INR","category":"vendor","vendorId":"vendor_acme"}'`,
        nodejs: `const { data } = await client.post('/transaction/assess', {
  amount: 45000,
  currency: 'INR',
  category: 'vendor',
  vendorId: 'vendor_acme',
});

switch (data.recommendation) {
  case 'approve':
    return processPayment();
  case 'review':
    return notifyOwner(data.risk);
  case 'block':
    return rejectPayment(data.risk.factors);
}`,
        python: `res = requests.post(f"{BASE}/transaction/assess", json={
    "amount": 45000,
    "currency": "INR",
    "category": "vendor",
    "vendorId": "vendor_acme",
}, headers=HEADERS)

data = res.json()
print(f"Recommendation: {data['recommendation']} (score: {data['risk']['score']:.2f})")`,
        go: `body, _ := json.Marshal(map[string]interface{}{
    "amount": 45000,
    "currency": "INR",
    "category": "vendor",
})

req, _ := http.NewRequest("POST", BASE+"/transaction/assess", bytes.NewBuffer(body))
req.Header.Set("X-API-Key", apiKey)

resp, err := http.DefaultClient.Do(req)`
      }
    }
  },
  {
    id: 'transactions/history',
    title: 'History',
    group: 'Transactions',
    content: {
      title: 'GET /transaction/history',
      method: 'GET',
      path: '/transaction/history',
      description: 'Returns paginated allocation history for your tenant, newest first.',
      queryParams: [
        { name: 'page', type: 'integer', required: false, description: 'Page number (default: 1)' },
        { name: 'limit', type: 'integer', required: false, description: 'Results per page (default: 20, max: 100)' },
        { name: 'from', type: 'date', required: false, description: 'Filter from date (YYYY-MM-DD)' },
        { name: 'to', type: 'date', required: false, description: 'Filter to date (YYYY-MM-DD)' },
        { name: 'bucket', type: 'string', required: false, description: 'Filter by bucket: tax, operations, growth' }
      ],
      responseExample: {
        data: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 143,
          totalPages: 8
        }
      },
      codeExamples: {
        curl: `curl "https://api.decisionapi.dev/v1/transaction/history?page=1&limit=20" \\
  -H "X-API-Key: dev-key-001"`,
        nodejs: `const { data } = await client.get('/transaction/history', {
  params: { page: 1, limit: 20 }
});

console.log('Total allocations:', data.pagination.total);`,
        python: `res = requests.get(f"{BASE}/transaction/history", params={
    "page": 1,
    "limit": 20
}, headers=HEADERS)

data = res.json()
print(f"Page {data['pagination']['page']} of {data['pagination']['totalPages']}")`,
        go: `req, _ := http.NewRequest("GET", BASE+"/transaction/history?page=1&limit=20", nil)
req.Header.Set("X-API-Key", apiKey)

resp, err := http.DefaultClient.Do(req)`
      }
    }
  },
  {
    id: 'rules/list',
    title: 'List Rules',
    group: 'Rules',
    content: {
      title: 'GET /rules',
      method: 'GET',
      path: '/rules',
      description: 'List all rules for your tenant, sorted by priority ascending (lowest number = evaluated first).',
      responseExample: {
        data: [
          {
            id: 'rule_1e3c',
            name: 'GST auto-reserve',
            trigger: {
              event: 'transaction.received',
              conditions: [
                { field: 'source', operator: 'eq', value: 'invoice' }
              ]
            },
            action: {
              type: 'allocate',
              params: {
                buckets: [
                  { bucket: 'tax', percentage: 18 },
                  { bucket: 'operations', percentage: 52 },
                  { bucket: 'growth', percentage: 30 }
                ]
              }
            },
            priority: 10,
            enabled: true,
            createdAt: '2026-04-01T09:00:00Z'
          }
        ],
        total: 1
      },
      codeExamples: {
        curl: `curl https://api.decisionapi.dev/v1/rules \\
  -H "X-API-Key: dev-key-001"`,
        nodejs: `const { data } = await client.get('/rules');
console.log('Rules:', data.data.length);`,
        python: `res = requests.get(f"{BASE}/rules", headers=HEADERS)
data = res.json()
print(f"Total rules: {data['total']}")`,
        go: `req, _ := http.NewRequest("GET", BASE+"/rules", nil)
req.Header.Set("X-API-Key", apiKey)

resp, err := http.DefaultClient.Do(req)`
      }
    }
  },
  {
    id: 'rules/create',
    title: 'Create Rule',
    group: 'Rules',
    content: {
      title: 'POST /rules',
      method: 'POST',
      path: '/rules',
      description: 'Create a new allocation or risk rule. Rules are evaluated in priority order — first match wins.',
      requestBody: {
        fields: [
          { name: 'name', type: 'string', required: true, description: 'Human-readable rule name' },
          { name: 'trigger.event', type: 'string', required: true, description: 'transaction.received | expense.requested | period.end' },
          { name: 'trigger.conditions', type: 'array', required: true, description: 'Array of { field, operator, value } triplets' },
          { name: 'action.type', type: 'string', required: true, description: 'allocate | block | flag | notify' },
          { name: 'action.params', type: 'object', required: false, description: 'Shape depends on action type' },
          { name: 'priority', type: 'integer', required: false, description: 'Lower = evaluated first (default: 100)' },
          { name: 'enabled', type: 'boolean', required: false, description: 'Enable/disable rule (default: true)' }
        ]
      },
      responseExample: {
        id: 'rule_5f8a',
        name: 'GST reserve — large invoices',
        trigger: {
          event: 'transaction.received',
          conditions: [
            { field: 'amount', operator: 'gte', value: 10000 },
            { field: 'source', operator: 'eq', value: 'invoice' }
          ]
        },
        action: {
          type: 'allocate',
          params: {
            buckets: [
              { bucket: 'tax', percentage: 18 },
              { bucket: 'operations', percentage: 52 },
              { bucket: 'growth', percentage: 30 }
            ]
          }
        },
        priority: 10,
        enabled: true,
        createdAt: '2026-04-12T10:30:00Z'
      },
      codeExamples: {
        curl: `curl -X POST https://api.decisionapi.dev/v1/rules \\
  -H "X-API-Key: dev-key-001" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Block large new-vendor payments",
    "trigger": {
      "event": "expense.requested",
      "conditions": [
        { "field": "amount", "operator": "gte", "value": 50000 },
        { "field": "category", "operator": "eq", "value": "vendor" }
      ]
    },
    "action": { "type": "block" },
    "priority": 5
  }'`,
        nodejs: `await client.post('/rules', {
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
});`,
        python: `res = requests.post(f"{BASE}/rules", json={
    "name": "Block large new-vendor payments",
    "trigger": {
        "event": "expense.requested",
        "conditions": [
            {"field": "amount", "operator": "gte", "value": 50000},
            {"field": "category", "operator": "eq", "value": "vendor"}
        ]
    },
    "action": {"type": "block"},
    "priority": 5
}, headers=HEADERS)`,
        go: `body, _ := json.Marshal(map[string]interface{}{
    "name": "Block large new-vendor payments",
    "trigger": map[string]interface{}{
        "event": "expense.requested",
        "conditions": []map[string]interface{}{
            {"field": "amount", "operator": "gte", "value": 50000},
        },
    },
    "action": map[string]interface{}{"type": "block"},
    "priority": 5,
})

req, _ := http.NewRequest("POST", BASE+"/rules", bytes.NewBuffer(body))
req.Header.Set("X-API-Key", apiKey)`
      }
    }
  },
  {
    id: 'rules/update',
    title: 'Update Rule',
    group: 'Rules',
    content: {
      title: 'PUT /rules/:id',
      method: 'PUT',
      path: '/rules/:id',
      description: 'Full replacement of a rule. Any field not sent is reset to its default.',
      requestBody: {
        fields: [
          { name: 'name', type: 'string', required: true, description: 'Human-readable rule name' },
          { name: 'trigger', type: 'object', required: true, description: 'Trigger configuration' },
          { name: 'action', type: 'object', required: true, description: 'Action configuration' },
          { name: 'priority', type: 'integer', required: true, description: 'Priority number' },
          { name: 'enabled', type: 'boolean', required: true, description: 'Enable/disable rule' }
        ]
      },
      responseExample: {
        id: 'rule_1e3c',
        name: 'GST auto-reserve (updated)',
        trigger: {
          event: 'transaction.received',
          conditions: [
            { field: 'source', operator: 'eq', value: 'invoice' }
          ]
        },
        action: {
          type: 'allocate',
          params: {
            buckets: [
              { bucket: 'tax', percentage: 18 },
              { bucket: 'operations', percentage: 52 },
              { bucket: 'growth', percentage: 30 }
            ]
          }
        },
        priority: 10,
        enabled: true,
        updatedAt: '2026-04-12T10:30:00Z'
      },
      codeExamples: {
        curl: `curl -X PUT https://api.decisionapi.dev/v1/rules/rule_1e3c \\
  -H "X-API-Key: dev-key-001" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "GST auto-reserve (updated)",
    "trigger": { ... },
    "action": { ... },
    "priority": 10,
    "enabled": true
  }'`,
        nodejs: `await client.put('/rules/rule_1e3c', {
  name: "GST auto-reserve (updated)",
  trigger: { ... },
  action: { ... },
  priority: 10,
  enabled: true
});`,
        python: `res = requests.put(f"{BASE}/rules/rule_1e3c", json={
    "name": "GST auto-reserve (updated)",
    "trigger": {...},
    "action": {...},
    "priority": 10,
    "enabled": True
}, headers=HEADERS)`,
        go: `body, _ := json.Marshal(ruleData)
req, _ := http.NewRequest("PUT", BASE+"/rules/rule_1e3c", bytes.NewBuffer(body))
req.Header.Set("X-API-Key", apiKey)`
      }
    }
  },
  {
    id: 'rules/delete',
    title: 'Delete Rule',
    group: 'Rules',
    content: {
      title: 'DELETE /rules/:id',
      method: 'DELETE',
      path: '/rules/:id',
      description: 'Permanently deletes the rule. The system default allocation applies for transactions that previously matched it.',
      responseExample: null,
      codeExamples: {
        curl: `curl -X DELETE https://api.decisionapi.dev/v1/rules/rule_1e3c \\
  -H "X-API-Key: dev-key-001"`,
        nodejs: `await client.delete('/rules/rule_1e3c');`,
        python: `res = requests.delete(f"{BASE}/rules/rule_1e3c", headers=HEADERS)`,
        go: `req, _ := http.NewRequest("DELETE", BASE+"/rules/rule_1e3c", nil)
req.Header.Set("X-API-Key", apiKey)`
      }
    }
  },
  {
    id: 'simulate/allocation',
    title: 'Simulate Allocation',
    group: 'Simulation',
    content: {
      title: 'POST /simulate/allocation',
      method: 'POST',
      path: '/simulate/allocation',
      description: 'Dry-run POST /transaction/allocate — identical logic, nothing persisted, no webhooks fired. Use this to test scenarios before going live.',
      requestBody: {
        fields: [
          { name: 'amount', type: 'number', required: true, description: 'Test amount' },
          { name: 'currency', type: 'string', required: true, description: 'ISO 4217 code' },
          { name: 'source', type: 'string', required: true, description: 'invoice | transfer | subscription | refund | other' },
          { name: 'overrideRules', type: 'array', required: false, description: 'Array of hypothetical rule objects to test' }
        ]
      },
      responseExample: {
        simulated: true,
        allocations: [
          { bucket: 'tax', percentage: 18, amount: 36000 },
          { bucket: 'operations', percentage: 52, amount: 104000 },
          { bucket: 'growth', percentage: 30, amount: 60000 }
        ],
        ruleApplied: 'system_default'
      },
      codeExamples: {
        curl: `curl -X POST https://api.decisionapi.dev/v1/simulate/allocation \\
  -H "X-API-Key: dev-key-001" \\
  -H "Content-Type: application/json" \\
  -d '{"amount":200000,"currency":"INR","source":"invoice"}'`,
        nodejs: `const { data } = await client.post('/simulate/allocation', {
  amount: 200000,
  currency: 'INR',
  source: 'invoice'
});

console.log('Simulated allocation:', data.allocations);`,
        python: `res = requests.post(f"{BASE}/simulate/allocation", json={
    "amount": 200000,
    "currency": "INR",
    "source": "invoice"
}, headers=HEADERS)

data = res.json()
print(f"Simulated: {data['simulated']}")`,
        go: `body, _ := json.Marshal(map[string]interface{}{
    "amount": 200000,
    "currency": "INR",
    "source": "invoice",
})

req, _ := http.NewRequest("POST", BASE+"/simulate/allocation", bytes.NewBuffer(body))
req.Header.Set("X-API-Key", apiKey)`
      }
    }
  },
  {
    id: 'simulate/cashflow',
    title: 'Simulate Cashflow',
    group: 'Simulation',
    content: {
      title: 'POST /simulate/cashflow',
      method: 'POST',
      path: '/simulate/cashflow',
      description: 'Project bucket balances forward N periods given expected inflows and outflows. Supports multiple scenarios.',
      requestBody: {
        fields: [
          { name: 'periods', type: 'integer', required: true, description: 'Number of periods (1-60)' },
          { name: 'periodUnit', type: 'string', required: true, description: 'month | quarter' },
          { name: 'initialBalances', type: 'object', required: true, description: '{ tax, operations, growth }' },
          { name: 'projectedInflows', type: 'array', required: true, description: 'Array of { amount, source, frequency }' },
          { name: 'projectedOutflows', type: 'array', required: true, description: 'Array of { amount, category, frequency }' },
          { name: 'scenarios', type: 'array', required: true, description: 'Subset of: base, upside_20pct, downside_20pct, downside_40pct' }
        ]
      },
      responseExample: {
        simulated: true,
        periods: 12,
        periodUnit: 'month',
        scenarios: {
          base: {
            timeline: [
              {
                period: 'Jan',
                inflow: 125000,
                outflow: 55000,
                net: 70000,
                balances: { tax: 45000, operations: 97500, growth: 80000 }
              }
            ],
            riskEvents: []
          },
          downside_20pct: {
            timeline: [],
            riskEvents: [
              { period: 'Aug', type: 'bucket_negative', bucket: 'operations', deficit: 12000 }
            ]
          }
        },
        summary: {
          base: { riskEventCount: 0, lowestBalance: { tax: 22500, operations: 42500 } },
          downside_20pct: { riskEventCount: 1, lowestBalance: { operations: -12000 } }
        }
      },
      codeExamples: {
        curl: `curl -X POST https://api.decisionapi.dev/v1/simulate/cashflow \\
  -H "X-API-Key: dev-key-001" \\
  -H "Content-Type: application/json" \\
  -d '{
    "periods": 12,
    "periodUnit": "month",
    "initialBalances": {"tax": 22500, "operations": 62500, "growth": 40000},
    "projectedInflows": [{"amount": 125000, "source": "invoice", "frequency": "monthly"}],
    "projectedOutflows": [{"amount": 40000, "category": "payroll", "frequency": "monthly"}],
    "scenarios": ["base", "downside_20pct"]
  }'`,
        nodejs: `const { data } = await client.post('/simulate/cashflow', {
  periods: 12,
  periodUnit: 'month',
  initialBalances: { tax: 22500, operations: 62500, growth: 40000 },
  projectedInflows: [{ amount: 125000, source: 'invoice', frequency: 'monthly' }],
  projectedOutflows: [{ amount: 40000, category: 'payroll', frequency: 'monthly' }],
  scenarios: ['base', 'downside_20pct']
});

console.log('Scenarios:', Object.keys(data.scenarios));`,
        python: `res = requests.post(f"{BASE}/simulate/cashflow", json={
    "periods": 12,
    "periodUnit": "month",
    "initialBalances": {"tax": 22500, "operations": 62500, "growth": 40000},
    "projectedInflows": [{"amount": 125000, "source": "invoice", "frequency": "monthly"}],
    "projectedOutflows": [{"amount": 40000, "category": "payroll", "frequency": "monthly"}],
    "scenarios": ["base", "downside_20pct"]
}, headers=HEADERS)

data = res.json()
print(f"Risk events in downside: {data['scenarios']['downside_20pct']['riskEvents']}")`,
        go: `body, _ := json.Marshal(payload)
req, _ := http.NewRequest("POST", BASE+"/simulate/cashflow", bytes.NewBuffer(body))
req.Header.Set("X-API-Key", apiKey)`
      }
    }
  },
  {
    id: 'simulate/rule-test',
    title: 'Test Rule',
    group: 'Simulation',
    content: {
      title: 'POST /simulate/rule-test',
      method: 'POST',
      path: '/simulate/rule-test',
      description: 'Test a rule definition against sample transactions before saving it. Returns match rate and per-transaction results.',
      requestBody: {
        fields: [
          { name: 'rule', type: 'object', required: true, description: 'Rule definition to test' },
          { name: 'sampleTransactions', type: 'array', required: true, description: 'Array of sample transaction objects' }
        ]
      },
      responseExample: {
        simulated: true,
        rule: 'unnamed rule',
        totalSamples: 3,
        matched: 2,
        unmatched: 1,
        matchRate: '66.7%',
        results: [
          { transaction: { amount: 30000 }, matched: false, wouldFallToDefault: true },
          { transaction: { amount: 80000 }, matched: true, action: { type: 'allocate' } },
          { transaction: { amount: 120000 }, matched: true, action: { type: 'allocate' } }
        ]
      },
      codeExamples: {
        curl: `curl -X POST https://api.decisionapi.dev/v1/simulate/rule-test \\
  -H "X-API-Key: dev-key-001" \\
  -H "Content-Type: application/json" \\
  -d '{
    "rule": {
      "trigger": {
        "event": "transaction.received",
        "conditions": [{ "field": "amount", "operator": "gte", "value": 50000 }]
      },
      "action": { "type": "allocate", "params": { "buckets": [{ "bucket": "tax", "percentage": 20 }] } }
    },
    "sampleTransactions": [
      { "amount": 30000, "source": "invoice" },
      { "amount": 80000, "source": "invoice" }
    ]
  }'`,
        nodejs: `const { data } = await client.post('/simulate/rule-test', {
  rule: {
    trigger: {
      event: 'transaction.received',
      conditions: [{ field: 'amount', operator: 'gte', value: 50000 }]
    },
    action: { type: 'allocate', params: { buckets: [{ bucket: 'tax', percentage: 20 }] } }
  },
  sampleTransactions: [
    { amount: 30000, source: 'invoice' },
    { amount: 80000, source: 'invoice' }
  ]
});

console.log('Match rate:', data.matchRate);`,
        python: `res = requests.post(f"{BASE}/simulate/rule-test", json={
    "rule": {
        "trigger": {
            "event": "transaction.received",
            "conditions": [{"field": "amount", "operator": "gte", "value": 50000}]
        },
        "action": {"type": "allocate", "params": {"buckets": [{"bucket": "tax", "percentage": 20}]}}
    },
    "sampleTransactions": [
        {"amount": 30000, "source": "invoice"},
        {"amount": 80000, "source": "invoice"}
    ]
}, headers=HEADERS)

data = res.json()
print(f"Match rate: {data['matchRate']}")`,
        go: `body, _ := json.Marshal(payload)
req, _ := http.NewRequest("POST", BASE+"/simulate/rule-test", bytes.NewBuffer(body))
req.Header.Set("X-API-Key", apiKey)`
      }
    }
  },
  {
    id: 'webhooks/overview',
    title: 'Webhooks Overview',
    group: 'Webhooks',
    content: {
      title: 'Webhooks',
      sections: [
        {
          heading: 'Overview',
          content: `Webhooks let you receive real-time push events instead of polling. Register a URL and we'll POST events to it as they happen.`
        },
        {
          heading: 'Event types',
          table: {
            headers: ['Event', 'Fired when'],
            rows: [
              ['transaction.allocated', 'Every call to POST /transaction/allocate succeeds'],
              ['risk.flagged', 'An assessment returns medium/high/critical risk'],
              ['rule.triggered', 'A custom rule fires on a transaction'],
              ['expense.approved', 'Assessment returns approve'],
              ['expense.blocked', 'Assessment returns block']
            ]
          }
        },
        {
          heading: 'Payload envelope',
          codeExample: {
            language: 'json',
            code: `{
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
}`
          }
        },
        {
          heading: 'Signature verification (Node.js)',
          codeExample: {
            language: 'javascript',
            code: `const crypto = require('crypto');

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
});`
          }
        },
        {
          heading: 'Signature verification (Python)',
          codeExample: {
            language: 'python',
            code: `import hmac, hashlib

def verify_webhook(payload_bytes, secret, signature_header):
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
    return 'ok', 200`
          }
        },
        {
          heading: 'Retry policy',
          table: {
            headers: ['Attempt', 'Delay'],
            rows: [
              ['1st retry', '5 seconds'],
              ['2nd retry', '25 seconds'],
              ['3rd retry', '125 seconds']
            ]
          },
          content: `\nFailed deliveries (non-2xx response or timeout) are retried 3 times with exponential backoff. After 3 failures the event is marked \`failed\`.`
        }
      ]
    }
  },
  {
    id: 'webhooks/list',
    title: 'List Webhooks',
    group: 'Webhooks',
    content: {
      title: 'GET /webhooks',
      method: 'GET',
      path: '/webhooks',
      description: 'List all registered webhooks for your tenant.',
      responseExample: {
        data: [
          {
            id: 'wh_9f2c',
            url: 'https://yourapp.com/webhooks/decision',
            events: ['transaction.allocated', 'risk.flagged'],
            enabled: true,
            createdAt: '2026-04-01T09:00:00Z'
          }
        ]
      },
      codeExamples: {
        curl: `curl https://api.decisionapi.dev/v1/webhooks \\
  -H "X-API-Key: dev-key-001"`,
        nodejs: `const { data } = await client.get('/webhooks');
console.log('Webhooks:', data.data.length);`,
        python: `res = requests.get(f"{BASE}/webhooks", headers=HEADERS)
print(res.json())`,
        go: `req, _ := http.NewRequest("GET", BASE+"/webhooks", nil)
req.Header.Set("X-API-Key", apiKey)
resp, err := http.DefaultClient.Do(req)`
      }
    }
  },
  {
    id: 'webhooks/register',
    title: 'Register Webhook',
    group: 'Webhooks',
    content: {
      title: 'POST /webhooks',
      method: 'POST',
      path: '/webhooks',
      description: 'Register a URL to receive push events. Returns a signing secret — shown once, store it securely.',
      requestBody: {
        fields: [
          { name: 'url', type: 'string', required: true, description: 'Your HTTPS endpoint' },
          { name: 'events', type: 'array', required: true, description: 'Array of event types to subscribe to' }
        ]
      },
      responseExample: {
        id: 'wh_9f2c',
        url: 'https://yourapp.com/webhooks/decision',
        events: ['transaction.allocated', 'risk.flagged'],
        secret: 'abc123def456...',
        enabled: true
      },
      codeExamples: {
        curl: `curl -X POST https://api.decisionapi.dev/v1/webhooks \\
  -H "X-API-Key: dev-key-001" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://yourapp.com/webhooks/decision",
    "events": ["transaction.allocated", "risk.flagged"]
  }'`,
        nodejs: `const { data } = await client.post('/webhooks', {
  url: 'https://yourapp.com/webhooks/decision',
  events: ['transaction.allocated', 'risk.flagged']
});

// IMPORTANT: Save data.secret immediately - it's shown only once!
console.log('Webhook secret:', data.secret);`,
        python: `res = requests.post(f"{BASE}/webhooks", json={
    "url": "https://yourapp.com/webhooks/decision",
    "events": ["transaction.allocated", "risk.flagged"]
}, headers=HEADERS)

data = res.json()
print(f"Save this secret: {data['secret']}")`,
        go: `body, _ := json.Marshal(map[string]interface{}{
    "url": "https://yourapp.com/webhooks/decision",
    "events": []string{"transaction.allocated", "risk.flagged"},
})

req, _ := http.NewRequest("POST", BASE+"/webhooks", bytes.NewBuffer(body))
req.Header.Set("X-API-Key", apiKey)`
      }
    }
  },
  {
    id: 'webhooks/delete',
    title: 'Delete Webhook',
    group: 'Webhooks',
    content: {
      title: 'DELETE /webhooks/:id',
      method: 'DELETE',
      path: '/webhooks/:id',
      description: 'Removes the webhook. No events will be delivered after deletion.',
      responseExample: null,
      codeExamples: {
        curl: `curl -X DELETE https://api.decisionapi.dev/v1/webhooks/wh_9f2c \\
  -H "X-API-Key: dev-key-001"`,
        nodejs: `await client.delete('/webhooks/wh_9f2c');`,
        python: `res = requests.delete(f"{BASE}/webhooks/wh_9f2c", headers=HEADERS)`,
        go: `req, _ := http.NewRequest("DELETE", BASE+"/webhooks/wh_9f2c", nil)
req.Header.Set("X-API-Key", apiKey)`
      }
    }
  },
  {
    id: 'webhooks/deliveries',
    title: 'Delivery Log',
    group: 'Webhooks',
    content: {
      title: 'GET /webhooks/:id/deliveries',
      method: 'GET',
      path: '/webhooks/:id/deliveries',
      description: 'Returns the delivery log for a webhook — useful for debugging failed events.',
      queryParams: [
        { name: 'status', type: 'string', required: false, description: 'Filter: delivered | failed | pending' }
      ],
      responseExample: {
        data: [
          {
            event: 'transaction.allocated',
            attempt: 1,
            status: 200,
            success: true,
            loggedAt: '2026-04-12T10:30:05Z'
          },
          {
            event: 'risk.flagged',
            attempt: 3,
            status: 0,
            success: false,
            error: 'Request timeout',
            loggedAt: '2026-04-12T10:28:00Z'
          }
        ]
      },
      codeExamples: {
        curl: `curl "https://api.decisionapi.dev/v1/webhooks/wh_9f2c/deliveries?status=failed" \\
  -H "X-API-Key: dev-key-001"`,
        nodejs: `const { data } = await client.get('/webhooks/wh_9f2c/deliveries', {
  params: { status: 'failed' }
});

console.log('Failed deliveries:', data.data.length);`,
        python: `res = requests.get(f"{BASE}/webhooks/wh_9f2c/deliveries", params={
    "status": "failed"
}, headers=HEADERS)

data = res.json()
print(f"Failed: {len(data['data'])}")`,
        go: `req, _ := http.NewRequest("GET", BASE+"/webhooks/wh_9f2c/deliveries?status=failed", nil)
req.Header.Set("X-API-Key", apiKey)`
      }
    }
  },
  {
    id: 'quickstart-guides',
    title: 'Quickstart',
    group: 'Overview',
    content: {
      title: 'Quickstart Guide',
      sections: [
        {
          heading: 'Step 1 — Get your API key',
          content: `Local dev (no signup needed): use dev-key-001.

Production: sign up at https://app.decisionapi.dev, then copy your key from Settings > API Keys.`
        },
        {
          heading: 'Step 2 — Make your first request (cURL)',
          codeExample: {
            language: 'bash',
            code: `curl -X POST http://localhost:3000/api/v1/transaction/allocate \\
  -H "X-API-Key: dev-key-001" \\
  -H "Content-Type: application/json" \\
  -d '{
    "transactionId": "my_first_txn",
    "amount": 100000,
    "currency": "INR",
    "source": "invoice"
  }'`
          }
        },
        {
          heading: 'Expected response',
          codeExample: {
            language: 'json',
            code: `{
  "allocationId": "alloc_4b7f",
  "transactionId": "my_first_txn",
  "totalAmount": 100000,
  "currency": "INR",
  "allocations": [
    { "bucket": "tax", "percentage": 18, "amount": 18000 },
    { "bucket": "operations", "percentage": 52, "amount": 52000 },
    { "bucket": "growth", "percentage": 30, "amount": 30000 }
  ],
  "ruleApplied": "system_default",
  "processedAt": "2026-04-12T10:30:00Z"
}`
          }
        },
        {
          heading: 'Node.js example',
          codeExample: {
            language: 'javascript',
            code: `require('dotenv').config();
const axios = require('axios');

const api = axios.create({
  baseURL: process.env.API_BASE || 'http://localhost:3000/api/v1',
  headers: { 'X-API-Key': process.env.API_KEY || 'dev-key-001' }
});

async function main() {
  const { data: alloc } = await api.post('/transaction/allocate', {
    transactionId: 'my_first_txn',
    amount: 100000,
    currency: 'INR',
    source: 'invoice',
  });
  alloc.allocations.forEach((a) => {
    console.log(\`\${a.bucket}: ₹\${a.amount} (\${a.percentage}%)\`);
  });

  const { data: risk } = await api.post('/transaction/assess', {
    amount: 25000,
    currency: 'INR',
    category: 'vendor',
  });
  console.log(\`Spend of ₹25,000: \${risk.recommendation} (score \${risk.risk.score})\`);
}

main().catch(console.error);`
          }
        },
        {
          heading: 'Python example',
          codeExample: {
            language: 'python',
            code: `import os, requests
from dotenv import load_dotenv

load_dotenv()
BASE = os.getenv("API_BASE", "http://localhost:3000/api/v1")
HEADERS = {"X-API-Key": os.getenv("API_KEY", "dev-key-001")}

def allocate(transaction_id: str, amount: float) -> dict:
    res = requests.post(
        f"{BASE}/transaction/allocate",
        json={"transactionId": transaction_id, "amount": amount, "currency": "INR", "source": "invoice"},
        headers={**HEADERS, "X-Idempotency-Key": transaction_id},
    )
    res.raise_for_status()
    return res.json()

def assess(amount: float, category: str) -> str:
    res = requests.post(
        f"{BASE}/transaction/assess",
        json={"amount": amount, "currency": "INR", "category": category},
        headers=HEADERS,
    )
    res.raise_for_status()
    return res.json()["recommendation"]`
          }
        },
        {
          heading: 'Step 3 — Create a rule',
          codeExample: {
            language: 'bash',
            code: `curl -X POST http://localhost:3000/api/v1/rules \\
  -H "X-API-Key: dev-key-001" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Large invoice — extra tax reserve",
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
          { "bucket": "tax", "percentage": 22 },
          { "bucket": "operations", "percentage": 48 },
          { "bucket": "growth", "percentage": 30 }
        ]
      }
    },
    "priority": 10
  }'`
          }
        },
        {
          heading: 'Step 4 — Test before going live',
          codeExample: {
            language: 'bash',
            code: `curl -X POST http://localhost:3000/api/v1/simulate/rule-test \\
  -H "X-API-Key: dev-key-001" \\
  -H "Content-Type: application/json" \\
  -d '{
    "rule": {
      "trigger": {
        "event": "transaction.received",
        "conditions": [{ "field": "amount", "operator": "gte", "value": 100000 }]
      },
      "action": { "type": "allocate", "params": { "buckets": [] } }
    },
    "sampleTransactions": [
      { "amount": 50000, "source": "invoice" },
      { "amount": 100000, "source": "invoice" },
      { "amount": 150000, "source": "transfer" }
    ]
  }'`
          }
        },
        {
          heading: 'Step 5 — Register a webhook (optional)',
          codeExample: {
            language: 'bash',
            code: `curl -X POST http://localhost:3000/api/v1/webhooks \\
  -H "X-API-Key: dev-key-001" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://yourapp.com/webhooks/decision",
    "events": ["transaction.allocated", "risk.flagged"]
  }'`
          }
        },
        {
          heading: "What's next?",
          content: `Read full API docs, verify webhook signatures, integrate simulate/cashflow in reporting, and wire docs routes into your frontend dashboard plan.`
        }
      ]
    }
  },
  {
    id: 'changelog',
    title: 'Changelog',
    group: 'Changelog',
    content: {
      title: 'Changelog',
      sections: [
        {
          heading: 'v1.0.0 — April 2026',
          content: `**Initial release**

Endpoints:
• POST /transaction/allocate — Automatic fund allocation
• POST /transaction/assess — Pre-spend risk assessment
• GET /transaction/history — Allocation history
• GET/POST /rules — Rule management
• PUT/DELETE /rules/:id — Update and delete rules
• POST /simulate/* — Simulation endpoints
• GET/POST /webhooks — Webhook management
• GET /webhooks/:id/deliveries — Delivery logs

Features:
• HMAC-SHA256 webhook signature verification
• Idempotency support via X-Idempotency-Key header
• Rate limiting per tenant (60-300 req/min based on plan)
• Real-time push events for allocations and risk flags`
        },
        {
          heading: 'Versioning policy',
          content: `Breaking changes increment the major version (v1 → v2). Old versions remain available for 12 months after a new major version is released.

We recommend subscribing to our changelog RSS feed to stay informed about updates.`
        }
      ]
    }
  }
];

// Group sections for sidebar navigation
export const groupedSections = docSections.reduce((acc, section) => {
  const group = section.group;
  if (!acc[group]) {
    acc[group] = [];
  }
  acc[group].push(section);
  return acc;
}, {});

// Helper to get section by ID
export const getSectionById = (id) => {
  return docSections.find(s => s.id === id);
};

// Helper to get next/prev sections for navigation
export const getAdjacentSections = (id) => {
  const index = docSections.findIndex(s => s.id === id);
  return {
    prev: index > 0 ? docSections[index - 1] : null,
    next: index < docSections.length - 1 ? docSections[index + 1] : null
  };
};
