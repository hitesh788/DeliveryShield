const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:3000",
  "http://localhost:8081",
  "http://172.16.149.138:8081",
  ... (process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [])
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

app.use(express.json());

// Request Logger
app.use((req, res, next) => {
  console.log(`Incoming Request: ${req.method} ${req.url}`);
  next();
});

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
