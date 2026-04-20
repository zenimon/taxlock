import mongoose from "mongoose";

const deliveryLogSchema = new mongoose.Schema({
    event: { type: String, required: true },
    attempt: { type: String },
    status: { type: Number },
    success: { type: Boolean },
    error: { type: String },
    loggedAt: { type: Date, default: Date.now }
}, { _id: false });

const webhookSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    tenantId: { type: String, required: true, index: true },
    url: { type: String, required: true },
    events: [{ type: String }],
    secret: { type: String, required: true },
    enabled: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
});

const deliverySchema = new mongoose.Schema({
    webhookId: { type: String, required: true, index: true },
    logs: [deliveryLogSchema]
});

export const WebhookModel = mongoose.model("Webhook", webhookSchema);
export const DeliveryModel = mongoose.model("Delivery", deliverySchema);
