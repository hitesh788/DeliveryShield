const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getVaultModel } = require('../utils/vault');
const router = express.Router();
const publicUser = (user) => ({
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    platform: user.platform,
    platformId: user.platformId,
    rating: user.rating,
    feedbackCount: user.feedbackCount,
    complaintsCount: user.complaintsCount,
    city: user.city,
    averageWeeklyIncome: user.averageWeeklyIncome,
    walletBalance: user.walletBalance,
    currentPlan: user.currentPlan,
    upiId: user.upiId,
    autoRenew: user.autoRenew
});

router.post('/register', async (req, res) => {
    try {
        let { name, email, phone, password, platform, platformId, city, averageWeeklyIncome } = req.body;
        if (!email) return res.status(400).json({ error: 'Email address is required' });
        email = email.trim().toLowerCase();
        phone = phone.trim();
        const existingUser = await User.findOne({ $or: [{ phone }, { email }] });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
            name,
            email,
            phone,
            password: hashedPassword,
            platform,
            platformId: platformId || '',
            city,
            averageWeeklyIncome
        });

        await user.save();

        res.status(201).json({
            message: 'Registration successful. You can now login.',
            email
        });
    } catch (err) {
        console.error("Register Error:", err);
        res.status(500).json({ error: err.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        let { phone, email, password } = req.body;

        let user;
        if (phone) {
            phone = phone.trim();
            user = await User.findOne({ phone });
        } else if (email) {
            email = email.trim().toLowerCase();
            user = await User.findOne({ email });
        } else {
            return res.status(400).json({ error: 'Phone or Email and password are required' });
        }

        if (!password) {
            return res.status(400).json({ error: 'Phone or Email and password are required' });
        }

        if (!user) return res.status(400).json({ error: 'User not found' });
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

const getMergedTransactions = async (userId, query = {}) => {
    const UserTx = getVaultModel(userId, 'Transaction');
    const baseQuery = { user: userId, ...query };

    const [vaultTransactions, legacyTransactions] = await Promise.all([
        UserTx.find(baseQuery).lean(),
        Transaction.find(baseQuery).lean()
    ]);

    // Older payment flows wrote to the shared transactions collection,
    // while wallet and claim flows use the per-user vault collection.
    return [...vaultTransactions, ...legacyTransactions].sort((a, b) => {
        const dateA = new Date(a.transactionDate || a.createdAt || 0).getTime();
        const dateB = new Date(b.transactionDate || b.createdAt || 0).getTime();
        return dateB - dateA;
    });
};

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

        const UserTx = getVaultModel(user._id, 'Transaction');
        const tx = new UserTx({
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
        const history = await getMergedTransactions(req.user.id, {
            type: { $in: ['wallet_withdrawal', 'plan_upgrade', 'premium_payment', 'wallet_topup', 'claim_payout'] }
        });
        res.json(history);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/transactions', authMiddleware, async (req, res) => {
    try {
        const { type } = req.query;
        const query = {};
        if (type && type !== 'all') query.type = type;

        const history = await getMergedTransactions(req.user.id, query);
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

        const UserTx = getVaultModel(user._id, 'Transaction');
        const tx = new UserTx({
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
        const { name, city, platform, platformId, averageWeeklyIncome, upiId } = req.body;
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (name) user.name = name;
        if (city) user.city = city;
        if (platform) user.platform = platform;
        if (platformId) user.platformId = platformId;
        if (averageWeeklyIncome) user.averageWeeklyIncome = Number(averageWeeklyIncome);
        if (upiId !== undefined) user.upiId = upiId;

        await user.save();
        res.json({ message: 'Profile updated successfully', user: publicUser(user) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
