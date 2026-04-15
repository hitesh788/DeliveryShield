const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['premium_payment', 'claim_payout', 'wallet_withdrawal'], required: true },
    amount: { type: Number, required: true },
    upiId: { type: String, default: null },
    status: { type: String, enum: ['success', 'failed', 'pending'], default: 'success' },
    transactionDate: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
