const mongoose = require('mongoose');

const policySchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    planName: { type: String, enum: ['BASIC PLAN', 'BETA PLAN', 'PRO LEVEL', 'ELITE CORP'], default: 'BASIC PLAN' },
    weeklyPremium: { type: Number, required: true },
    incomeCovered: { type: Number, required: true }, // The maximum amount payable in case of extreme disruption
    status: { type: String, enum: ['active', 'expired', 'cancelled'], default: 'active' },
    autoRenew: { type: Boolean, default: false },
    coveredDisruptions: [{ type: String }],
    riskFactor: { type: Number, required: true } // calculated by AI
}, { timestamps: true });

module.exports = mongoose.model('Policy', policySchema);
