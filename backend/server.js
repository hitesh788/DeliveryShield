require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://deliveryshield.vercel.app"
  ],
  credentials: true
}));
app.use(express.json());

// Debug logs
console.log("🚀 Starting server...");
console.log("MONGO_URI:", process.env.MONGO_URI ? "FOUND ✅" : "MISSING ❌");

// Routes
const authRoutes = require('./routes/auth');
const policyRoutes = require('./routes/policy');
const claimRoutes = require('./routes/claim.cjs');
const adminRoutes = require('./routes/admin');

app.use('/api/auth', authRoutes);
app.use('/api/policy', policyRoutes);
app.use('/api/claim', claimRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => res.send('DeliveryShield Backend is Running..'));

const PORT = process.env.PORT || 5000;

// Force server to start (IMPORTANT)
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});

// MongoDB connection (separate)
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.error('❌ DB ERROR:', err));

// Catch hidden crashes
process.on('uncaughtException', err => {
    console.error('❌ UNCAUGHT EXCEPTION:', err);
});

process.on('unhandledRejection', err => {
    console.error('❌ UNHANDLED REJECTION:', err);
});