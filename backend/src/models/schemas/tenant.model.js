import mongoose from "mongoose";

const tenantSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    apiKey: { type: String, required: true, unique: true },
    plan: { type: String, default: "starter" },
    createdAt: { type: Date, default: Date.now },
});

export const TenantModel = mongoose.model("Tenant", tenantSchema);
