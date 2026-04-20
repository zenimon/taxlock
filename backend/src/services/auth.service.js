import { TenantRepository } from "../models/tenant.repository.js";
import { AppError } from "../utils/AppError.js";

export class AuthService {
    /**
     * Registers a new tenant and generates an API key.
     */
    static async register(businessName, email, password) {
        // Basic check if already exists
        const existing = await TenantRepository.findByEmail(email);
        if (existing) {
            throw new AppError("CONFLICT", "Account with this email already exists", 409);
        }

        // Create the tenant
        const { tenant, apiKey } = await TenantRepository.create({
            name: businessName,
            email,
            password, // In production, hash this!
        });

        return { tenant, apiKey };
    }

    /**
     * Validates credentials and returns tenant/apiKey.
     */
    static async login(email, password) {
        const tenantWithSecrets = await TenantRepository.findByEmail(email);

        if (!tenantWithSecrets || tenantWithSecrets.password !== password) {
            throw new AppError("UNAUTHORIZED", "Invalid email or password", 401);
        }

        const apiKey = await TenantRepository.getApiKeyByEmail(email);

        return { tenant: tenantWithSecrets, apiKey };
    }
}
