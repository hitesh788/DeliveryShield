const express = require('express');
const axios = require('axios');
const auth = require('../middleware/auth');

const Claim = require('../models/Claim');
const Policy = require('../models/Policy');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { getVaultModel } = require('../utils/vault');

const router = express.Router();


// ✅ Only backend env variables
const API_KEY = process.env.OPENWEATHER_API_KEY;

// ================= AUTO CLAIM =================
router.post('/auto-trigger', auth, async (req, res) => {
    try {
        let { disruptionType, lat, lon } = req.body;

        console.log("📥 BODY:", req.body);

        const user = await User.findById(req.user.id);
        const policy = await Policy.findOne({ user: user._id, status: 'active' });

        if (!policy) {
            return res.status(400).json({ error: 'No active policy found' });
        }

        // 🌍 Default location based on Profile City if lat/lon missing
        if (!lat || !lon) {
            const cityCoords = {
                'Mumbai': { lat: 19.0760, lon: 72.8777 },
                'Delhi': { lat: 28.6139, lon: 77.2090 },
                'Bangalore': { lat: 12.9716, lon: 77.5946 },
                'Chennai': { lat: 13.0827, lon: 80.2707 }
            };
            const defaultPos = cityCoords[user.city] || cityCoords['Chennai'];
            lat = defaultPos.lat;
            lon = defaultPos.lon;
        }

        console.log("🔑 API KEY:", API_KEY ? "FOUND ✅" : "MISSING ❌");

        // 🔁 Default mock values
        let temp = 37;
        let condition = ["Clear", "Clouds", "Rain", "Haze"][Math.floor(Math.random() * 4)];
        let aqi = Math.floor(Math.random() * 5) + 1;

        // 🌦 REAL WEATHER API
        if (API_KEY) {
            try {
                const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;

                const weatherRes = await axios.get(weatherUrl);
                const weatherData = weatherRes.data;

                temp = weatherData.main.temp;
                condition = weatherData.weather[0].main;

                console.log(`📡 WEATHER API SUCCESS: [Lat: ${lat}, Lon: ${lon}] Result: ${temp}°C, "${condition}"`);

                // 🌫 AQI API (only for pollution)
                if (disruptionType === 'Pollution') {
                    const aqiUrl = `http://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`;
                    const aqiRes = await axios.get(aqiUrl);

                    if (aqiRes.data.list && aqiRes.data.list[0]) {
                        aqi = aqiRes.data.list[0].main.aqi;
                    }
                }

            } catch (err) {
                console.log("⚠️ Weather API failed, using mock data");
            }
        }

        // ================= FRAUD CHECK =================
        let isFraudulent = false;
        let fraudScore = 0;
        let rejectReason = '';

        if (disruptionType === 'Extreme Heat') {
            console.log(`🔥 [HEAT CHECK] Current: ${temp}°C | Target: 37°C`);
            if (temp < 37) {
                isFraudulent = true;
                fraudScore = 95;
                rejectReason = `Extreme Heat condition not met. Temperature: ${temp}°C (required ≥ 37°C)`;
            }
        }

        else if (disruptionType === 'Heavy Rain') {
            if (!['Rain', 'Thunderstorm', 'Drizzle'].includes(condition)) {
                isFraudulent = true;
                fraudScore = 98;
                rejectReason = `No rainfall detected. Current condition: "${condition}"`;
            }
        }

        else if (disruptionType === 'Pollution') {
            if (aqi < 4) {
                isFraudulent = true;
                fraudScore = 97;
                rejectReason = `AQI too low. Current level: ${aqi} (required ≥ 4)`;
            }
        }

        else {
            isFraudulent = true;
            fraudScore = 100;
            rejectReason = `❌ Invalid disruption type`;
        }

        const payout = Math.round((policy.incomeCovered || 7000) / 7);

        // ================= REJECT =================
        if (isFraudulent) {
            const rejectedClaim = new Claim({
                user: user._id,
                policy: policy._id,
                disruptionType,
                dateOfDisruption: new Date(),
                amountPayout: 0,
                status: 'rejected',
                fraudScore,
                isFraudulent: true,
                rejectionReason: rejectReason
            });

            await rejectedClaim.save();

            return res.status(400).json({
                message: "❌ Claim Rejected",
                reason: rejectReason
            });
        }

        // ================= APPROVE =================
        // 🔐 Use Individual User Vault for database separation
        const UserClaim = getVaultModel(user._id, 'Claim');

        const claim = new UserClaim({
            user: user._id,
            policy: policy._id,
            disruptionType,
            dateOfDisruption: new Date(),
            amountPayout: payout,
            status: 'auto-approved',
            fraudScore: Math.floor(Math.random() * 20),
            isFraudulent: false
        });

        await claim.save();

        // 💰 Update wallet
        user.walletBalance = (user.walletBalance || 0) + payout;
        await user.save();

        // 💳 Transaction in User Vault
        const UserTx = getVaultModel(user._id, 'Transaction');
        const tx = new UserTx({
            user: user._id,
            type: 'claim_payout',
            amount: payout,
            balanceAfter: user.walletBalance,
            description: `${disruptionType} claim payout`,
            status: 'success'
        });

        await tx.save();

        return res.status(201).json({
            message: `✅ Claim Approved! ₹${payout} credited`,
            claim
        });

    } catch (err) {
        console.error("❌ CLAIM ERROR:", err);
        return res.status(500).json({ error: err.message });
    }
});

// ================= CLAIM HISTORY =================
router.get('/', auth, async (req, res) => {
    try {
        const UserClaim = getVaultModel(req.user.id, 'Claim');
        const claims = await UserClaim.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.json(claims);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;