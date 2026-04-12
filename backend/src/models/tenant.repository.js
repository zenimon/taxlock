/**
 * models/tenant.repository.js
 *
 * Looks up tenants by API key.
 * In production: query your tenants table.
 * For dev/test: uses the hardcoded map below.
 */

const DEV_TENANTS = new Map([
  ["dev-key-001", { id: "tenant_dev_001", name: "Acme Corp", plan: "starter" }],
  ["dev-key-002", { id: "tenant_dev_002", name: "Beta Foods", plan: "growth" }],
]);

export class TenantRepository {
  static async findByApiKey(apiKey) {
    // In production: SELECT * FROM tenants WHERE api_key_hash = hash(apiKey) LIMIT 1
    return DEV_TENANTS.get(apiKey) ?? null;
  }

  static async findById(tenantId) {
    return [...DEV_TENANTS.values()].find((t) => t.id === tenantId) ?? null;
  }
}
