const mongoose = require('mongoose');

const claimSchema = new mongoose.Schema({
    policy: { type: mongoose.Schema.Types.ObjectId, ref: 'Policy', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    disruptionType: { type: String, enum: ['Heavy Rain', 'Extreme Heat', 'Pollution', 'Curfew'], required: true },
    dateOfDisruption: { type: Date, required: true },
    amountPayout: { type: Number, required: true },
    status: { type: String, enum: ['auto-approved', 'processing', 'rejected'], default: 'auto-approved' },
    fraudScore: { type: Number, default: 0 }, // 0-100, >70 is suspicious
    isFraudulent: { type: Boolean, default: false },
    rejectionReason: { type: String, default: '' },
    weatherSnapshot: {
        temperature: { type: Number, default: null },
        condition: { type: String, default: '' },
        aqi: { type: Number, default: null },
        lat: { type: Number, default: null },
        lon: { type: Number, default: null }
    },
    timeline: [{
        label: { type: String, required: true },
        detail: { type: String, default: '' },
        status: { type: String, enum: ['success', 'failed', 'pending'], default: 'success' },
        timestamp: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

module.exports = mongoose.model('Claim', claimSchema);
