const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

router.post('/register', async (req, res) => {
    try {
        let { name, phone, password, platform, city, averageWeeklyIncome } = req.body;
        phone = phone.trim();
        const existingUser = await User.findOne({ phone });
        if (existingUser) return res.status(400).json({ error: 'User already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ name, phone, password: hashedPassword, platform, city, averageWeeklyIncome });
        await user.save();

        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        console.error("Register Error:", err);
        res.status(500).json({ error: err.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        let { phone, password } = req.body;
        phone = phone.trim();
        const user = await User.findOne({ phone });
        if (!user) return res.status(400).json({ error: 'User not found (' + phone + ')' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ id: user._id, role: user.role, city: user.city }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { id: user._id, name: user.name, role: user.role, city: user.city, averageWeeklyIncome: user.averageWeeklyIncome, walletBalance: user.walletBalance, currentPlan: user.currentPlan } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const authMiddleware = require('../middleware/auth');
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: "User not found" });
        res.json({ id: user._id, name: user.name, role: user.role, city: user.city, averageWeeklyIncome: user.averageWeeklyIncome, walletBalance: user.walletBalance, currentPlan: user.currentPlan });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const Transaction = require('../models/Transaction');

// Withdraw endpoint
router.post('/withdraw', authMiddleware, async (req, res) => {
    try {
        const { upiId, amount } = req.body;
        const user = await User.findById(req.user.id);

        if (amount > user.walletBalance) {
            return res.status(400).json({ error: "Insufficient wallet balance" });
        }

        // Deduct balance
        user.walletBalance -= amount;
        await user.save();

        const tx = new Transaction({
            user: user._id,
            type: 'wallet_withdrawal',
            amount: amount,
            upiId: upiId,
            status: 'success'
        });
        await tx.save();

        res.json({ message: "Payout successful", newBalance: user.walletBalance, upiId, amount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/withdrawals', authMiddleware, async (req, res) => {
    try {
        const history = await Transaction.find({
            user: req.user.id,
            type: { $in: ['wallet_withdrawal', 'plan_upgrade', 'premium_payment'] }
        }).sort({ createdAt: -1 });
        res.json(history);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
