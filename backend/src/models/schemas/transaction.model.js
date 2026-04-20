import mongoose from "mongoose";

const allocationBucketSchema = new mongoose.Schema({
    bucket: { type: String, required: true },
    percentage: { type: Number },
    amount: { type: Number, required: true },
    reason: { type: String }
}, { _id: false });

const transactionSchema = new mongoose.Schema({
    allocationId: { type: String, required: true, unique: true },
    tenantId: { type: String, required: true, index: true },
    transactionId: { type: String },
    amount: { type: Number, required: true },
    totalAmount: { type: Number },
    currency: { type: String, required: true },
    source: { type: String },
    ruleApplied: { type: String },
    processedAt: { type: Date, default: Date.now, index: true },
    allocations: [allocationBucketSchema],
    metadata: { type: mongoose.Schema.Types.Mixed },
});

// Idempotency key schema
const idempotencySchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true }, // tenantId:key
    allocationId: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, expires: "24h" } // Auto-expire after 24h
});

// Bucket balances schema
const balancesSchema = new mongoose.Schema({
    tenantId: { type: String, required: true, unique: true },
    balances: { type: mongoose.Schema.Types.Mixed },
    updatedAt: { type: Date, default: Date.now }
});

export const TransactionModel = mongoose.model("Transaction", transactionSchema);
export const IdempotencyModel = mongoose.model("Idempotency", idempotencySchema);
export const BalancesModel = mongoose.model("Balances", balancesSchema);
