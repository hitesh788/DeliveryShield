const express = require('express');
const auth = require('../middleware/auth');
const Policy = require('../models/Policy');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { calculateWeeklyPremium } = require('../ai-module/riskAssessment');

const router = express.Router();

const PLAN_PRICES = {
    'BETA PLAN': 45,
    'PRO LEVEL': 95,
    'ELITE CORP': 150
};

// Get premium quote
router.get('/quote', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const quote = calculateWeeklyPremium(user.averageWeeklyIncome, user.city);
        res.json(quote);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Buy Policy
router.post('/buy', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const quote = calculateWeeklyPremium(user.averageWeeklyIncome, user.city);

        // Deactivate previous active policies
        await Policy.updateMany({ user: user._id, status: 'active' }, { status: 'cancelled' });

        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(startDate.getDate() + 7); // 1 week policy

        const policy = new Policy({
            user: user._id,
            startDate,
            endDate,
            weeklyPremium: quote.weeklyPremium,
            incomeCovered: quote.incomeCovered,
            riskFactor: quote.riskFactor
        });

        await policy.save();

        // Log transaction
        const tx = new Transaction({
            user: user._id,
            type: 'premium_payment',
            amount: quote.weeklyPremium,
            paymentMethod: 'razorpay',
            status: 'success'
        });
        await tx.save();

        res.status(201).json({ message: 'Policy activated successfully', policy });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Change Plan
router.post('/change-plan', auth, async (req, res) => {
    try {
        const { planName, paymentMethod } = req.body;
        const amount = PLAN_PRICES[planName];

        if (!amount) {
            return res.status(400).json({ error: 'Invalid plan selected' });
        }

        if (!['wallet', 'razorpay'].includes(paymentMethod)) {
            return res.status(400).json({ error: 'Invalid payment method' });
        }

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (paymentMethod === 'wallet') {
            if (user.walletBalance < amount) {
                return res.status(400).json({ error: 'Insufficient wallet balance' });
            }
            user.walletBalance -= amount;
        }

        user.currentPlan = planName;
        await user.save();

        const tx = new Transaction({
            user: user._id,
            type: 'plan_upgrade',
            amount,
            paymentMethod,
            planName,
            status: 'success'
        });
        await tx.save();

        res.json({
            message: paymentMethod === 'wallet'
                ? `Plan changed to ${planName}. Rs.${amount} deducted from wallet.`
                : `Plan changed to ${planName}. Razorpay payment successful.`,
            currentPlan: user.currentPlan,
            walletBalance: user.walletBalance,
            transaction: tx
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get active policy
router.get('/active', auth, async (req, res) => {
    try {
        const policy = await Policy.findOne({ user: req.user.id, status: 'active' });
        res.json(policy);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
