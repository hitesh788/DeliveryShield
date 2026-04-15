const mongoose = require('mongoose');

const policySchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    weeklyPremium: { type: Number, required: true },
    incomeCovered: { type: Number, required: true }, // The maximum amount payable in case of extreme disruption
    status: { type: String, enum: ['active', 'expired', 'cancelled'], default: 'active' },
    riskFactor: { type: Number, required: true } // calculated by AI
}, { timestamps: true });

module.exports = mongoose.model('Policy', policySchema);
