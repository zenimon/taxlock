/**
 * tests/integration/transaction.allocate.test.js
 *
 * Integration tests for POST /api/v1/transaction/allocate.
 * Boots the actual Express app against the in-memory store.
 */

import request from "supertest";
import app from "../../src/index.js";

const VALID_KEY = "dev-key-001";

describe("POST /api/v1/transaction/allocate", () => {
  const validBody = {
    transactionId: "txn_test_001",
    amount: 100000,
    currency: "INR",
    source: "invoice",
  };

  test("401 when no API key", async () => {
    const res = await request(app).post("/api/v1/transaction/allocate").send(validBody);
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  test("401 when invalid API key", async () => {
    const res = await request(app)
      .post("/api/v1/transaction/allocate")
      .set("X-API-Key", "bad-key")
      .send(validBody);
    expect(res.status).toBe(401);
  });

  test("400 when amount is missing", async () => {
    const res = await request(app)
      .post("/api/v1/transaction/allocate")
      .set("X-API-Key", VALID_KEY)
      .send({ transactionId: "txn_x", currency: "INR", source: "invoice" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  test("400 when amount is negative", async () => {
    const res = await request(app)
      .post("/api/v1/transaction/allocate")
      .set("X-API-Key", VALID_KEY)
      .send({ ...validBody, amount: -1000 });
    expect(res.status).toBe(400);
  });

  test("400 when currency format is invalid", async () => {
    const res = await request(app)
      .post("/api/v1/transaction/allocate")
      .set("X-API-Key", VALID_KEY)
      .send({ ...validBody, currency: "inr" }); // must be uppercase
    expect(res.status).toBe(400);
  });

  test("200 with correct allocation shape", async () => {
    const res = await request(app)
      .post("/api/v1/transaction/allocate")
      .set("X-API-Key", VALID_KEY)
      .send(validBody);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      transactionId: "txn_test_001",
      totalAmount: 100000,
      currency: "INR",
    });
    expect(Array.isArray(res.body.allocations)).toBe(true);
    expect(res.body.allocations.length).toBeGreaterThan(0);

    // Bucket amounts should sum to total
    const total = res.body.allocations.reduce((s, a) => s + a.amount, 0);
    expect(Math.abs(total - 100000)).toBeLessThan(1);
  });

  test("idempotency — same key returns same response", async () => {
    const idempotencyKey = "idem-test-001";
    const sendRequest = () =>
      request(app)
        .post("/api/v1/transaction/allocate")
        .set("X-API-Key", VALID_KEY)
        .set("X-Idempotency-Key", idempotencyKey)
        .send({ ...validBody, transactionId: "txn_idem_001" });

    const first  = await sendRequest();
    const second = await sendRequest();

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(first.body.allocationId).toBe(second.body.allocationId);
  });

  test("X-Request-Id header is present in response", async () => {
    const res = await request(app)
      .post("/api/v1/transaction/allocate")
      .set("X-API-Key", VALID_KEY)
      .send(validBody);
    expect(res.headers["x-request-id"]).toBeDefined();
  });
});
