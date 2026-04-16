const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Policy = require('../models/Policy');
const Claim = require('../models/Claim');
const Transaction = require('../models/Transaction');

const router = express.Router();

const adminOnly = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

router.get('/stats', auth, adminOnly, async (req, res) => {
    try {
        const [totalUsers, activePolicies, totalClaims, rejectedClaims, transactions] = await Promise.all([
            User.countDocuments(),
            Policy.countDocuments({ status: 'active' }),
            Claim.countDocuments(),
            Claim.countDocuments({ isFraudulent: true }),
            Transaction.find()
        ]);

        const totalPayouts = transactions
            .filter(tx => tx.type === 'claim_payout')
            .reduce((sum, tx) => sum + tx.amount, 0);

        const totalPremiums = transactions
            .filter(tx => ['premium_payment', 'plan_upgrade'].includes(tx.type))
            .reduce((sum, tx) => sum + tx.amount, 0);

        const cityRisk = await User.aggregate([
            { $group: { _id: '$city', users: { $sum: 1 }, avgIncome: { $avg: '$averageWeeklyIncome' } } },
            { $sort: { users: -1 } }
        ]);

        const recentClaims = await Claim.find().populate('user', 'name city platform').sort({ createdAt: -1 }).limit(8);

        res.json({
            totalUsers,
            activePolicies,
            totalClaims,
            rejectedClaims,
            totalPayouts,
            totalPremiums,
            cityRisk,
            recentClaims
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/users', auth, adminOnly, async (req, res) => {
    try {
        const users = await User.find({}, '-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
