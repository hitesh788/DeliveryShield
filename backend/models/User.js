const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['worker', 'admin'], default: 'worker' },
    platform: { type: String, enum: ['Zomato', 'Swiggy', 'Amazon', 'Zepto', 'Other'], required: true },
    city: { type: String, required: true },
    averageWeeklyIncome: { type: Number, required: true },
    currentPlan: { type: String, enum: ['BASIC PLAN', 'BETA PLAN', 'PRO LEVEL', 'ELITE CORP'], default: 'BASIC PLAN' },
    walletBalance: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
