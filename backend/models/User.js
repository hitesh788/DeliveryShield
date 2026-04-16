const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },

    phone: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['worker', 'admin'], default: 'worker' },
    platform: { type: String, enum: ['Zomato', 'Swiggy', 'Blinkit', 'Zepto', 'Amazon', 'Other'], required: true },
    platformId: { type: String, default: '' }, // Unique ID from delivery app
    rating: { type: Number, default: 4.5 }, // Simulated rider rating (1-5)
    feedbackCount: { type: Number, default: 0 },
    complaintsCount: { type: Number, default: 0 },
    city: { type: String, required: true },
    averageWeeklyIncome: { type: Number, required: true },
    currentPlan: { type: String, enum: ['BASIC PLAN', 'BETA PLAN', 'PRO LEVEL', 'ELITE CORP'], default: 'BASIC PLAN' },
    upiId: { type: String, default: '' },
    autoRenew: { type: Boolean, default: false },
    walletBalance: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
