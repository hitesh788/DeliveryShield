const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

const publicUser = (user) => ({
    id: user._id,
    name: user.name,
    phone: user.phone,
    role: user.role,
    platform: user.platform,
    city: user.city,
    averageWeeklyIncome: user.averageWeeklyIncome,
    walletBalance: user.walletBalance,
    currentPlan: user.currentPlan,
    upiId: user.upiId,
    autoRenew: user.autoRenew
});

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
        if (user.role === 'admin') return res.status(403).json({ error: 'Please use admin login' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ id: user._id, role: user.role, city: user.city }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: publicUser(user) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const authMiddleware = require('../middleware/auth');
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: "User not found" });
        res.json(publicUser(user));
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
        user.upiId = upiId;
        await user.save();

        const tx = new Transaction({
            user: user._id,
            type: 'wallet_withdrawal',
            amount: amount,
            upiId: upiId,
            paymentMethod: 'wallet',
            balanceAfter: user.walletBalance,
            description: `Wallet withdrawal to ${upiId}`,
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
            type: { $in: ['wallet_withdrawal', 'plan_upgrade', 'premium_payment', 'wallet_topup'] }
        }).sort({ createdAt: -1 });
        res.json(history);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/transactions', authMiddleware, async (req, res) => {
    try {
        const { type } = req.query;
        const query = { user: req.user.id };
        if (type && type !== 'all') query.type = type;
        const history = await Transaction.find(query).sort({ createdAt: -1 });
        res.json(history);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/admin-login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const adminUsername = process.env.ADMIN_USERNAME || 'admin';
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

        if (username !== adminUsername || password !== adminPassword) {
            return res.status(400).json({ error: 'Invalid admin credentials' });
        }

        const token = jwt.sign({ id: 'system-admin', role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({
            token,
            admin: {
                id: 'system-admin',
                name: 'DeliveryShield Admin',
                role: 'admin'
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/wallet/topup', authMiddleware, async (req, res) => {
    try {
        const amount = Number(req.body.amount);
        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Enter a valid top-up amount' });
        }

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        user.walletBalance += amount;
        await user.save();

        const tx = new Transaction({
            user: user._id,
            type: 'wallet_topup',
            amount,
            paymentMethod: 'razorpay',
            balanceAfter: user.walletBalance,
            description: 'Wallet top-up via simulated Razorpay',
            status: 'success'
        });
        await tx.save();

        res.json({ message: `Wallet topped up with Rs.${amount}`, walletBalance: user.walletBalance, transaction: tx });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/profile', authMiddleware, async (req, res) => {
    try {
        const { name, city, platform, averageWeeklyIncome, upiId } = req.body;
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (name) user.name = name;
        if (city) user.city = city;
        if (platform) user.platform = platform;
        if (averageWeeklyIncome) user.averageWeeklyIncome = Number(averageWeeklyIncome);
        if (upiId !== undefined) user.upiId = upiId;

        await user.save();
        res.json({ message: 'Profile updated successfully', user: publicUser(user) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
