import { TenantModel } from "./schemas/tenant.model.js";

// Keep static tenants for dev convenience if needed, but primary source is now DB
const DEV_TENANTS_SEED = [
  {
    id: "tenant_dev_001",
    name: "Acme Corp",
    email: "admin@acme.com",
    password: "password123",
    apiKey: "dev-key-001",
    plan: "starter"
  },
  {
    id: "tenant_dev_002",
    name: "Beta Foods",
    email: "admin@betafoods.com",
    password: "password123",
    apiKey: "dev-key-002",
    plan: "growth"
  },
];

export class TenantRepository {
  static async findByApiKey(apiKey) {
    return await TenantModel.findOne({ apiKey }).lean();
  }

  static async findById(tenantId) {
    return await TenantModel.findOne({ id: tenantId }).lean();
  }

  static async findByEmail(email) {
    return await TenantModel.findOne({ email }).lean();
  }

  static async create({ name, email, password }) {
    const id = `tenant_${Math.random().toString(36).substr(2, 9)}`;
    const apiKey = `sk_live_${Math.random().toString(36).substr(2, 20)}`;
    const tenant = await TenantModel.create({ id, name, email, password, apiKey, plan: "starter" });
    return { tenant: tenant.toObject(), apiKey };
  }

  static async getApiKeyByEmail(email) {
    const tenant = await TenantModel.findOne({ email }).select("apiKey").lean();
    return tenant?.apiKey ?? null;
  }

  // Seeding helper
  static async seed() {
    for (const tenant of DEV_TENANTS_SEED) {
      const exists = await TenantModel.findOne({ id: tenant.id });
      if (!exists) {
        await TenantModel.create(tenant);
      }
    }
  }
}
