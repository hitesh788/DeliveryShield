const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getVaultModel } = require('../utils/vault');
const { sendOtpEmail, sendForgotPasswordEmail } = require('../utils/email');
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
            if (existingUser.isVerified) {
                return res.status(400).json({ error: 'User already exists and is already verified. Please login.' });
            }
            // If user exists but NOT verified, we will allow them to "re-register" (update OTP and try again)
            // Or we can just tell them to go to verify page.
            // Let's just update their info and send a new OTP.
            const hashedPassword = await bcrypt.hash(password, 8);
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

            existingUser.name = name;
            existingUser.password = hashedPassword;
            existingUser.platform = platform;
            existingUser.platformId = platformId || '';
            existingUser.city = city;
            existingUser.averageWeeklyIncome = averageWeeklyIncome;
            existingUser.otp = otp;
            existingUser.otpExpires = otpExpires;

            console.log(`🔑 DEBUG OTP (update) for ${email}: ${otp}`);

            await existingUser.save();

            // Send OTP in background - INSTANT RESPONSE
            sendOtpEmail(email, otp, name).catch(mailErr => {
                console.error("Background Mail Send Error (Re-register):", mailErr);
            });

            return res.status(201).json({
                message: 'Account exists but was unverified. A new OTP has been sent.',
                email,
                allowOtpInResponse: process.env.ALLOW_OTP_IN_RESPONSE === 'true' ? otp : undefined
            });
        }

        const hashedPassword = await bcrypt.hash(password, 8);

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry

        const user = new User({
            name,
            email,
            phone,
            password: hashedPassword,
            platform,
            platformId: platformId || '',
            city,
            averageWeeklyIncome,
            isVerified: false,
            otp,
            otpExpires
        });

        console.log(`🔑 DEBUG OTP for ${email}: ${otp}`);

        await user.save();

        // Send OTP in background - INSTANT RESPONSE
        sendOtpEmail(email, otp, name).catch(mailErr => {
            console.error("Background Mail Send Error:", mailErr);
        });

        res.status(201).json({
            message: 'Registration successful. Please verify your email with the OTP sent.',
            email,
            allowOtpInResponse: process.env.ALLOW_OTP_IN_RESPONSE === 'true' ? otp : undefined
        });
    } catch (err) {
        console.error("Register Error:", err);
        res.status(500).json({ error: err.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        let { phone, email, password } = req.body;
        console.log(`📡 Login Attempt - Email: ${email}, Phone: ${phone}`);

        let user;
        if (phone) {
            phone = phone.trim();
            user = await User.findOne({ phone });
        } else if (email) {
            email = email.trim().toLowerCase();
            user = await User.findOne({ email });
        } else {
            console.log("❌ Login failed: Both email and phone are missing in body");
            return res.status(400).json({ error: 'Phone or Email and password are required' });
        }

        if (!password) {
            console.log("❌ Login failed: Password missing");
            return res.status(400).json({ error: 'Phone or Email and password are required' });
        }

        if (!user) {
            console.log(`❌ Login failed: User not found for ${email || phone}`);
            return res.status(400).json({ error: 'User not found' });
        }
        if (user.role === 'admin') return res.status(403).json({ error: 'Please use admin login' });

        // Check if user is verified
        if (!user.isVerified) {
            return res.status(403).json({
                error: 'Account not verified. Please verify your email.',
                unverified: true,
                email: user.email
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ id: user._id, role: user.role, city: user.city }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: publicUser(user) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Verify OTP Route
router.post('/verify-otp', async (req, res) => {
    try {
        let { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json({ error: 'Email and OTP are required' });
        }

        email = email.trim().toLowerCase();
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ error: 'User not found' });
        }

        if (user.isVerified) {
            return res.status(400).json({ error: 'User is already verified' });
        }

        // Check OTP and Expiry
        if (user.otp !== otp) {
            return res.status(400).json({ error: 'Invalid OTP' });
        }

        if (user.otpExpires < new Date()) {
            return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
        }

        // Mark as verified
        user.isVerified = true;
        user.otp = null;
        user.otpExpires = null;
        await user.save();

        res.json({ message: 'Email verified successfully. You can now login.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Resend OTP Route
router.post('/resend-otp', async (req, res) => {
    try {
        let { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email is required' });

        email = email.trim().toLowerCase();
        const user = await User.findOne({ email });

        if (!user) return res.status(400).json({ error: 'User not found' });
        if (user.isVerified) return res.status(400).json({ error: 'User already verified' });

        // Generate new OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

        user.otp = otp;
        user.otpExpires = otpExpires;

        console.log(`🔑 DEBUG OTP (resend) for ${email}: ${otp}`);

        await user.save();

        // Send Email in background - INSTANT RESPONSE
        sendOtpEmail(user.email, otp, user.name).catch(mailErr => {
            console.error("Background Resend Mail Error:", mailErr);
        });

        res.json({
            message: 'A new OTP has been sent to your email.',
            allowOtpInResponse: process.env.ALLOW_OTP_IN_RESPONSE === 'true' ? otp : undefined
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Forgot Password Route
router.post('/forgot-password', async (req, res) => {
    try {
        let { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email is required' });

        email = email.trim().toLowerCase();
        const user = await User.findOne({ email });

        if (!user) return res.status(404).json({ error: 'No account found with this email' });

        // Generate temporary password
        const tempPassword = Math.random().toString(36).slice(-8) + Math.floor(Math.random() * 10);
        const hashedPassword = await bcrypt.hash(tempPassword, 8);

        user.password = hashedPassword;
        await user.save();

        // Send email
        sendForgotPasswordEmail(user.email, tempPassword, user.name).catch(mailErr => {
            console.error("Background Password Mail Error:", mailErr);
        });

        res.json({ message: 'A temporary password has been sent to your email.' });
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
            status: 'success',
            transactionDate: new Date()
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

        const UserTx = getVaultModel(req.user.id, 'Transaction');
        const tx = new UserTx({
            user: req.user.id,
            type: 'wallet_topup',
            amount: amount,
            paymentMethod: 'razorpay',
            balanceAfter: user.walletBalance,
            description: 'Wallet top-up via Razorpay',
            status: 'success',
            transactionDate: new Date()
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
