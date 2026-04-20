# TaxFlow Backend

> Embedded financial intelligence for small and medium businesses.

TaxFlow intercepts money events in real time and provides automated fund-splitting strategies (tax reserves, operations, growth capital) and risk-gating for outbound payments.

see the pitch deck - [text](https://drive.google.com/file/d/1rks_ZXWdZtRO3DjSGsvDlTOL7N7MOdSp/view?usp=sharing)

## 🚀 Quick Start

### 1. Installation
```bash
npm install
```

### 2. Environment Setup
Create a `.env` file in the `backend/` directory (or copy from `.env.example`).
```bash
cp .env.example .env
```
> [!NOTE]
> The application uses absolute path resolution for the `.env` file, ensuring it loads correctly regardless of where the process is started.

### 3. Start Development Server
```bash
npm run dev
```
- **Zero-Dependency**: If no MongoDB connection is found, the app automatically starts an **In-Memory MongoDB**. No local installation is required for testing.
- **API URL**: `http://localhost:3000/api/v1`
- **Interactive Docs**: [http://localhost:3000/docs](http://localhost:3000/docs)
- **Auto-Seeding**: The app seeds sample tenants and transactions on startup.

---

## 🔐 Login Details (Development)

The following credentials are pre-seeded in the development environment:

| Business Name | Email | Password | API Key |
|---------------|-------|----------|---------|
| Acme Corp | `admin@acme.com` | `password123` | `dev-key-001` |
| Beta Foods | `admin@betafoods.com` | `password123` | `dev-key-002` |

You can use these credentials for the `/auth/login` endpoint or use the API keys directly in requested headers.

---

## 🧪 Testing

The project uses a comprehensive testing suite powered by Jest and Supertest.

### Test Environment
- **Database**: Integration tests use `mongodb-memory-server` to run a completely isolated, volatile MongoDB instance in RAM. No local MongoDB installation is required.
- **Seeding**: The test suite automatically seeds necessary tenant data before each test, ensuring a consistent environment.
- **Isolation**: All database collections are cleared between test runs to prevent state leakage.

### Running Tests
```bash
# Run all tests (Unit + Integration)
npm test

# Run specific test suites
npm run test:unit         # Pure logic tests (fast, no I/O)
npm run test:integration  # Full HTTP flow tests (database-backed)

# View coverage report
npm run test:coverage
```

### Possible Outcomes
- **Success (Exit Code 0)**: All assertions passed. You should see a green summary of passed tests.
- **Validation Failure**: Usually occurs if API payloads don't match the schema or rules engine expectations. Check the `details` field in the 400 response.
- **Authentication Failure (401)**: Occurs if the `X-API-Key` is missing or invalid. Default dev keys are `dev-key-001` and `dev-key-002`.
- **Database Timeout**: May occur if the in-memory server fails to start or if requests hang.

---

## 🛠 Troubleshooting

### Port 3000 Already in Use
If you see the error `Error: Port 3000 is already in use`, it means another process (perhaps a previous instance of the server) is still running.
- **Fix**: Identify and kill the process: `fuser -k 3000/tcp` or manually stop the redundant terminal.

### MongoDB Connection Issues
- **Local Dev**: Ensure your `MONGODB_URI` in `.env` is correct. If using Atlas, ensure your IP is whitelisted.
- **Tests**: If tests fail with connection errors, ensure `mongodb-memory-server` has permission to download its binary (requires internet access on first run).

---

## 🏗 Architecture

- **`src/services/`**: Core business logic. `rules.engine.js` is a pure condition evaluator.
- **`src/models/`**: Repository pattern. Data access is decoupled from services, allowing for easy migration from in-memory/Atlas to on-prem databases.
- **`src/utils/seedData.js`**: Generates realistic startup data including SaaS subscriptions and payroll expenses.

---

## 📡 API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/transaction/allocate`| Split incoming funds |
| POST | `/api/v1/transaction/assess`  | Pre-spend risk check |
| GET  | `/api/v1/transaction/history` | Allocation history |
| GET  | `/api/v1/rules`               | Manage decision rules |
| POST | `/api/v1/simulate/cashflow`  | Multi-period projections |
| GET  | `/api/v1/health`              | System pulse |

For detailed request/response schemas, visit the [Swagger Docs](http://localhost:3000/docs).
