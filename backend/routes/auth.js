const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();
const { sendOtpEmail } = require('../utils/email');

const createOtp = () => Math.floor(100000 + Math.random() * 900000).toString();
const canExposeOtp = () => process.env.ALLOW_OTP_IN_RESPONSE === 'true';

const sendVerificationOtp = async (user) => {
    const otp = createOtp();
    user.emailOtp = otp;
    user.emailOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
    user.isEmailVerified = false;
    await user.save();

    try {
        await sendOtpEmail(user.email, otp);
        return { sent: true, otp };
    } catch (mailErr) {
        console.error('OTP email send failed:', mailErr.code || mailErr.message);
        console.log(`DEV FALLBACK OTP for ${user.email}: ${otp}`);
        return { sent: false, otp, error: mailErr.code || mailErr.message };
    }
};

const publicUser = (user) => ({
    id: user._id,
    name: user.name,
    email: user.email,
    isEmailVerified: user.isEmailVerified,
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
        let { name, email, phone, password, platform, city, averageWeeklyIncome } = req.body;
        if (!email) return res.status(400).json({ error: 'Email address is required' });
        email = email.trim().toLowerCase();
        phone = phone.trim();
        const existingUser = await User.findOne({ $or: [{ phone }, { email }] });
        if (existingUser) {
            if (existingUser.isEmailVerified) {
                return res.status(400).json({ error: 'User already exists' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            existingUser.name = name;
            existingUser.email = email;
            existingUser.phone = phone;
            existingUser.password = hashedPassword;
            existingUser.platform = platform;
            existingUser.city = city;
            existingUser.averageWeeklyIncome = averageWeeklyIncome;

            const result = await sendVerificationOtp(existingUser);
            return res.status(result.sent ? 200 : 202).json({
                message: result.sent
                    ? 'Account already exists but is not verified. A new OTP was sent.'
                    : 'Account exists but OTP email could not be sent. Check backend email settings, then use Resend OTP.',
                email,
                requiresVerification: true,
                ...(canExposeOtp() ? { devOtp: result.otp } : {})
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
            name,
            email,
            phone,
            password: hashedPassword,
            platform,
            city,
            averageWeeklyIncome,
            isEmailVerified: false
        });

        const result = await sendVerificationOtp(user);
        res.status(result.sent ? 201 : 202).json({
            message: result.sent
                ? 'Registration successful. OTP sent to your email.'
                : 'Registration saved, but OTP email could not be sent. Check backend email settings, then use Resend OTP.',
            email,
            requiresVerification: true,
            ...(canExposeOtp() ? { devOtp: result.otp } : {})
        });
    } catch (err) {
        console.error("Register Error:", err);
        res.status(500).json({ error: err.message });
    }
});

router.post('/verify-email', async (req, res) => {
    try {
        let { email, otp } = req.body;
        if (!email || !otp) return res.status(400).json({ error: 'Email and OTP are required' });
        email = email.trim().toLowerCase();

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: 'User not found' });
        if (user.isEmailVerified) return res.json({ message: 'Email already verified' });
        if (!user.emailOtp || user.emailOtp !== otp.trim()) return res.status(400).json({ error: 'Invalid OTP' });
        if (!user.emailOtpExpires || user.emailOtpExpires < new Date()) return res.status(400).json({ error: 'OTP expired. Please resend OTP.' });

        user.isEmailVerified = true;
        user.emailOtp = null;
        user.emailOtpExpires = null;
        await user.save();

        res.json({ message: 'Email verified successfully. You can now login.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/resend-otp', async (req, res) => {
    try {
        let { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email is required' });
        email = email.trim().toLowerCase();

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: 'User not found' });
        if (user.isEmailVerified) return res.json({ message: 'Email already verified' });

        const result = await sendVerificationOtp(user);
        if (!result.sent) {
            return res.status(202).json({
                message: 'OTP could not be sent. Check backend email settings.',
                email,
                ...(canExposeOtp() ? { devOtp: result.otp } : {})
            });
        }

        res.json({
            message: 'New OTP sent to your email',
            ...(canExposeOtp() ? { devOtp: result.otp } : {})
        });
    } catch (err) {
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
        if (!user.isEmailVerified) return res.status(403).json({ error: 'Please verify your email before login' });

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
