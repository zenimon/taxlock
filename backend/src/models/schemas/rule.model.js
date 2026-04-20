import mongoose from "mongoose";

const ruleSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    triggerEvent: { type: String, index: true },
    actionType: { type: String },
    actionParams: { type: mongoose.Schema.Types.Mixed },
    trigger: {
        event: { type: String },
        conditions: { type: mongoose.Schema.Types.Mixed },
    },
    priority: { type: Number, default: 100 },
    enabled: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
});

export const RuleModel = mongoose.model("Rule", ruleSchema);
