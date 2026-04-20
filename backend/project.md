# TaxFlow TaxFlow — Project Context

## 🧠 Overview

TaxFlow is a **financial decision infrastructure API** designed to be embedded into fintech platforms and business systems.

It processes transactions in real time and provides:

* intelligent fund allocation (tax, operations, growth)
* multi-factor risk scoring
* decision outputs (approve / review / block)
* simulation capabilities for forecasting and testing

This system is built as a **modular, production-grade backend** following strict separation of concerns.

---

## 🎯 Core Objective

To create a **plug-and-play financial control layer** that:

* influences how money is allocated at the moment of transaction
* prevents financial mismanagement
* enables platforms to offer proactive financial intelligence

---

## 🏗️ Architecture Philosophy

The system follows a **layered architecture with clear responsibility boundaries**:

### Request Flow

Client
→ Middleware (auth, logging, rate limit)
→ Routes (validation + wiring)
→ Controllers (HTTP bridge)
→ Services (business logic)
→ Engine (core decision logic)
→ Models/Repositories (data access)
→ Response

---

## 📁 Project Structure

### Root

* `.env.example` — environment variables template
* `package.json` — scripts (dev, test, coverage)
* `README.md` — documentation

---

### ⚙️ Config Layer

**config/**

* `env.js` — validated environment config (single source of truth)

---

### 🚀 Entry Point

**src/**

* `index.js` — Express bootstrap, middleware chain, route mounting

---

### 🟢 Routes Layer (Validation + Wiring)

Handles:

* request validation
* endpoint definition
* routing to controllers

Files:

* `transaction.routes.js` → `/allocate`, `/assess`, `/history`
* `rules.routes.js` → CRUD for rules
* `simulation.routes.js` → `/allocation`, `/cashflow`, `/rule-test`
* `webhook.routes.js` → register, delete, delivery logs
* `health.routes.js` → uptime monitoring (no auth)

---

### 🟠 Controllers Layer (HTTP Bridge)

Responsible for:

* parsing request
* calling services
* formatting responses

Files:

* `transaction.controller.js`
* `rules.controller.js`
* `simulation.controller.js`
* `webhook.controller.js`

---

### 🟣 Services Layer (Business Logic Core)

This is the **heart of the system**.

Files:

* `allocation.service.js`

  * rules engine → bucket mapping → exact allocation amounts

* `risk.service.js`

  * multi-factor scoring (0–1)
  * outputs: approve / review / block

* `rules.engine.js`

  * stateless condition evaluator
  * rule matching logic

* `webhook.service.js`

  * HMAC-secured delivery
  * exponential retry mechanism

---

### 🌸 Simulation Layer (Dry Run Engine)

**simulation/**

* `cashflow.engine.js`

  * N-period projections
  * base / upside / downside scenarios

Purpose:

* test financial outcomes without real transactions

---

### 🟥 Middleware Layer (Request Pipeline)

Handles cross-cutting concerns:

* `authenticate.js`

  * X-API-Key → tenant resolution

* `errorHandler.js`

  * standardized error responses
  * no stack leaks in production

* `rateLimiter.js`

  * per-tenant sliding window

* `requestLogger.js`

  * request ID + response time tracking

---

### 🔵 Models / Repository Layer (Data Access)

Abstracts database operations:

* `transaction.repository.js`

  * allocations
  * bucket balances
  * idempotency

* `rules.repository.js`

  * full CRUD
  * priority-based sorting

* `tenant.repository.js`

  * API key → tenant mapping

* `webhook.repository.js`

  * registration
  * delivery logs
  * secret hashing

---

### 📄 API Documentation

**docs/**

* `swagger.js`

  * OpenAPI 3.0 specification
  * served at `/docs`

---

### 🛠️ Utilities

* `AppError.js`

  * structured error handling

* `generateId.js`

  * prefixed IDs
  * examples:

    * `alloc_9f2c`
    * `asmt_4b7f`

---

### 🧪 Testing Layer

**tests/** (Jest + Supertest)

#### Unit Tests

* `rules.engine.test.js`
* `allocation.service.test.js`

#### Integration Tests

* `transaction.allocate.test.js`

  * full request lifecycle
  * auth + validation + response

---

## 🔑 Core System Capabilities

### 1. Transaction Decisioning

* Real-time processing of financial events
* Output:

  * decision
  * risk score
  * allocation breakdown

---

### 2. Allocation Engine

* Converts rules into:

  * bucket assignments
  * exact monetary splits

---

### 3. Risk Engine

* Multi-factor scoring
* Produces:

  * APPROVE
  * REVIEW
  * BLOCK

---

### 4. Rule Engine

* Stateless evaluation
* Priority-based execution
* Supports complex condition chains

---

### 5. Simulation Engine

* Predicts future cash flow
* Enables scenario testing

---

### 6. Webhook System

* Event delivery to external systems
* Secure + retry-enabled

---

## 🔐 Security & Infra Features

* API key authentication (multi-tenant)
* HMAC webhook signing
* rate limiting per tenant
* idempotent transaction handling
* structured error handling

---

## ⚙️ Tech Stack

* Node.js
* Express.js
* MongoDB (repository pattern)
* Jest + Supertest
* OpenAPI (Swagger)

---

## 🚀 Current State

* Fully modular backend
* Clean separation of concerns
* Production-style architecture
* Test coverage included

---

## 🧭 Vision

TaxFlow is not just an API.

It is a **financial decision infrastructure layer** that can:

* be embedded into fintech platforms
* control how money flows in real time
* improve financial health at scale
* enhance financial product distribution

---

## 🧠 Instructions for AI / Contributors

When working with this project:

* Do NOT execute code
* Do NOT use external tools
* Follow existing architecture strictly
* Maintain separation of concerns
* Keep services stateless where possible
* Ensure all logic is testable

---

## 💡 Key Insight

> Businesses don’t fail because they don’t earn — they fail because they don’t control how money flows.

TaxFlow exists to solve exactly that.
