const express = require('express');
const auth = require('../middleware/auth');
const Policy = require('../models/Policy');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const axios = require('axios');
const API_KEY = process.env.OPENWEATHER_API_KEY;
const { calculateWeeklyPremium, explainRisk, recommendPlan, getPredictiveAlerts } = require('../ai-module/riskAssessment');

const cityCoords = {
    'Mumbai': { lat: 19.0760, lon: 72.8777 },
    'Delhi': { lat: 28.6139, lon: 77.2090 },
    'Bangalore': { lat: 12.9716, lon: 77.5946 },
    'Chennai': { lat: 13.0827, lon: 80.2707 }
};


const router = express.Router();

const PLAN_PRICES = {
    'BETA PLAN': 45,
    'PRO LEVEL': 95,
    'ELITE CORP': 150
};

const PLAN_DETAILS = {
    'BASIC PLAN': {
        price: 0,
        coverageBoost: 1,
        claimLimit: 1,
        payoutSpeed: 'Standard',
        coveredDisruptions: ['Heavy Rain', 'Extreme Heat']
    },
    'BETA PLAN': {
        price: 45,
        coverageBoost: 1.1,
        claimLimit: 2,
        payoutSpeed: 'Standard',
        coveredDisruptions: ['Heavy Rain', 'Extreme Heat', 'Pollution']
    },
    'PRO LEVEL': {
        price: 95,
        coverageBoost: 1.25,
        claimLimit: 4,
        payoutSpeed: 'Priority',
        coveredDisruptions: ['Heavy Rain', 'Extreme Heat', 'Pollution', 'Curfew']
    },
    'ELITE CORP': {
        price: 150,
        coverageBoost: 1.5,
        claimLimit: 10,
        payoutSpeed: 'Instant',
        coveredDisruptions: ['Heavy Rain', 'Extreme Heat', 'Pollution', 'Curfew']
    }
};

// Get premium quote
router.get('/quote', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        let weather = null;
        const { lat, lon } = req.query;

        if (API_KEY) {
            try {
                let pos;
                if (lat && lon) {
                    pos = { lat, lon };
                } else {
                    pos = cityCoords[user.city] || cityCoords['Mumbai'];
                }

                const weatherRes = await axios.get(`https://api.openweathermap.org/data/2.5/weather?lat=${pos.lat}&lon=${pos.lon}&appid=${API_KEY}&units=metric`);
                const aqiRes = await axios.get(`http://api.openweathermap.org/data/2.5/air_pollution?lat=${pos.lat}&lon=${pos.lon}&appid=${API_KEY}`);

                weather = {
                    temp: weatherRes.data.main.temp,
                    condition: weatherRes.data.weather[0].main,
                    aqi: aqiRes.data.list[0].main.aqi
                };
            } catch (wErr) {
                console.log("Weather fetch failed for quote");
            }
        }

        const quote = calculateWeeklyPremium(user.averageWeeklyIncome, user.city);
        res.json({
            ...quote,
            explanation: explainRisk(user.averageWeeklyIncome, user.city, weather),
            recommendedPlan: recommendPlan(user.averageWeeklyIncome, user.city, weather),
            predictiveAlerts: getPredictiveAlerts(user.city, weather),
            plans: PLAN_DETAILS,
            liveWeather: weather
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/plans', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.json({
            currentPlan: user.currentPlan,
            recommendedPlan: recommendPlan(user.averageWeeklyIncome, user.city),
            plans: PLAN_DETAILS
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Buy Policy
router.post('/buy', auth, async (req, res) => {
    try {
        const { paymentMethod = 'razorpay' } = req.body;
        const user = await User.findById(req.user.id);
        const quote = calculateWeeklyPremium(user.averageWeeklyIncome, user.city);

        if (!['wallet', 'razorpay'].includes(paymentMethod)) {
            return res.status(400).json({ error: 'Invalid payment method' });
        }

        if (paymentMethod === 'wallet') {
            if (user.walletBalance < quote.weeklyPremium) {
                return res.status(400).json({ error: 'Insufficient wallet balance' });
            }
            user.walletBalance -= quote.weeklyPremium;
            await user.save();
        }

        // Deactivate previous active policies
        await Policy.updateMany({ user: user._id, status: 'active' }, { status: 'cancelled' });

        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(startDate.getDate() + 7); // 1 week policy

        const policy = new Policy({
            user: user._id,
            startDate,
            endDate,
            planName: user.currentPlan,
            weeklyPremium: quote.weeklyPremium,
            incomeCovered: quote.incomeCovered,
            autoRenew: user.autoRenew,
            coveredDisruptions: PLAN_DETAILS[user.currentPlan]?.coveredDisruptions || PLAN_DETAILS['BASIC PLAN'].coveredDisruptions,
            riskFactor: quote.riskFactor
        });

        await policy.save();

        // Log transaction
        const tx = new Transaction({
            user: user._id,
            type: 'premium_payment',
            amount: quote.weeklyPremium,
            paymentMethod,
            planName: user.currentPlan,
            balanceAfter: user.walletBalance,
            description: `${user.currentPlan} weekly policy premium`,
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

        await Policy.updateMany(
            { user: user._id, status: 'active' },
            {
                planName,
                weeklyPremium: amount,
                incomeCovered: Math.round(user.averageWeeklyIncome * 0.8 * PLAN_DETAILS[planName].coverageBoost),
                coveredDisruptions: PLAN_DETAILS[planName].coveredDisruptions,
                autoRenew: user.autoRenew
            }
        );

        const tx = new Transaction({
            user: user._id,
            type: 'plan_upgrade',
            amount,
            paymentMethod,
            planName,
            balanceAfter: user.walletBalance,
            description: `${planName} plan payment via ${paymentMethod}`,
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

router.post('/auto-renew', auth, async (req, res) => {
    try {
        const { enabled } = req.body;
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        user.autoRenew = Boolean(enabled);
        await user.save();
        await Policy.updateMany({ user: user._id, status: 'active' }, { autoRenew: user.autoRenew });

        res.json({ message: user.autoRenew ? 'Auto-renewal enabled' : 'Auto-renewal disabled', autoRenew: user.autoRenew });
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
