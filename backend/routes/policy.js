const express = require('express');
const auth = require('../middleware/auth');
const Policy = require('../models/Policy');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { calculateWeeklyPremium } = require('../ai-module/riskAssessment');

const router = express.Router();

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
            status: 'success'
        });
        await tx.save();

        res.status(201).json({ message: 'Policy activated successfully', policy });
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
