/**
 * tests/jest.setup.js
 *
 * Global setup and teardown for Jest.
 * Boots an in-memory MongoDB server and connects Mongoose to it
 * before any integration tests run.
 */

import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

let mongoServer;

beforeAll(async () => {
    // 1. Start in-memory DB
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();

    // 2. Connect Mongoose
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
    await mongoose.connect(uri);
});

beforeEach(async () => {
    // Seed Tenants before each test since they are cleared in afterEach
    const { TenantRepository } = await import("../src/models/tenant.repository.js");
    await TenantRepository.seed();
});

afterAll(async () => {
    // 1. Disconnect Mongoose
    await mongoose.disconnect();

    // 2. Stop in-memory DB
    if (mongoServer) {
        await mongoServer.stop();
    }
});

// Clear data between tests to ensure isolation
afterEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany();
    }
});
