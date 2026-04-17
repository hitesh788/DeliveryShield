# 🚀 DeliveryShield – AI-Powered Parametric Insurance Platform

## 📌 Overview

**DeliveryShield** is an AI-driven parametric insurance platform designed for India’s gig economy workers such as delivery partners from Zomato, Swiggy, Amazon, and similar platforms.

The platform provides **automated income protection** against external disruptions like **extreme weather and pollution**, ensuring that gig workers do not lose their earnings due to uncontrollable conditions.

Unlike traditional insurance, DeliveryShield uses **parametric triggers + AI models** to enable **instant claim processing and payouts without manual intervention**.

---

## 🎯 Problem Statement

Gig workers often lose **20–30% of their income** due to:

* 🌧 Heavy rain or floods
* 🌡 Extreme heat
* 🌫 High pollution
* 🚫 City-wide strikes

Currently, there is **no reliable income protection system**, forcing workers to bear financial losses alone.

---

## 💡 Our Solution

DeliveryShield provides a smart, secure, and automated platform with:

* 🔍 AI-based fraud detection
* 📊 Risk assessment engine
* 📍 Location-based safety alerts
* 👤 User authentication & verification
* ⚡ Automated claim triggering & instant payouts
* 📱 Mobile app for delivery agents
* 🌐 Web dashboard for monitoring and analytics

---

## ⚠️ Constraints Followed

* ❌ No health insurance
* ❌ No accident or vehicle coverage
* ✅ Only **loss of income protection**
* ✅ **Weekly pricing model only**
* ✅ Fully **automated claims system**

---

## 🏗️ System Architecture

### 🔹 Components

* **Frontend (Web):** React.js + Vite + CSS
* **Mobile App:** React Native (Expo)
* **Backend:** Node.js + Express.js
* **Database:** MongoDB
* **AI & Security:** Risk scoring + fraud detection algorithms
* **APIs:** OpenWeather API (or mock APIs)
* **Payments:** Razorpay (test mode / simulated)

### 🔄 Workflow

1. User registers/login
2. AI calculates weekly premium
3. User buys insurance policy
4. System monitors external disruptions
5. Trigger detected (e.g., heavy rain)
6. Claim automatically generated
7. Instant payout processed

---

## 🧠 Key Features

### 👤 User Features

* Secure login & registration (JWT)
* Dashboard showing:

  * Active policy
  * Weekly premium
  * Earnings protected
  * Claim history
* Buy weekly insurance
* View automatic payouts

---

### 🛠 Admin Features

* Monitor users and policies
* Claims analytics dashboard
* Fraud detection logs
* Risk insights & reports

---

## ⚙️ Core Functional Modules

### 🤖 AI Risk Assessment

* Dynamic weekly premium calculation
* Based on:

  * Location risk
  * Weather patterns
  * Working hours

---

### ⚡ Parametric Triggers

Automatically detects:

* 🌧 Heavy Rain
* 🌡 Extreme Heat
* 🌫 Pollution

---

### 🔄 Automated Claim System

* No manual claim submission
* Auto-triggered claims
* Instant approval and payout

---

### 🕵️ Fraud Detection

* Detects duplicate claims
* Prevents fake weather claims
* Simulated GPS spoofing detection

---

### 💳 Payment System

* Instant payout simulation
* Transaction tracking

---

## 🧱 Tech Stack

### 🌐 Frontend

* React.js
* Vite
* CSS

### ⚙️ Backend

* Node.js
* Express.js
* MongoDB

### 📱 Mobile App

* React Native (Expo)

### 🤖 AI & Security

* Fraud Detection Algorithms
* Risk Scoring System
* API-based Threat Analysis

---

## 📁 Project Structure

```
DeliveryShield/
 ├── backend/        # Node.js + Express API
 ├── frontend/       # React Web App
 ├── mobile-app/     # React Native App (Expo)
 ├── .gitignore
 ├── README.md
```

## 🔁 Demo Scenario

### Example Use Case

* User: Swiggy delivery partner
* Weekly premium: ₹30
* Event: Heavy rain
* Income loss: ₹800

### System Flow

1. Weather API detects rain
2. System triggers claim automatically
3. AI calculates loss
4. Claim approved instantly
5. ₹800 payout shown in dashboard

---

## ⚙️ Installation & Setup

### 🔧 1. Clone Repository

```bash
git clone https://github.com/hitesh788/DeliveryShield.git
cd DeliveryShield
```

### 🔧 2. Backend Setup

```bash
cd backend
npm install
npm start
```

### 🔧 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### 🔧 4. Mobile App Setup

```bash
cd mobile-app
npm install
npx expo start
```

---

## 🔐 Environment Variables

Create a `.env` file inside `backend/`:

```
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
OPENWEATHER_API_KEY=your_api_key
```

---

## ✨ Key Features

✅ Real-time fraud detection
✅ AI-based risk analysis
✅ Secure authentication system
✅ Claims & policy management
✅ Mobile interface for delivery agents
✅ Web dashboard for monitoring
✅ API integration for external risk data

---

## 📸 Screenshots

(Add before submission)

* Web Dashboard
* Login/Register UI
* Mobile App Screens
* Alerts & Notifications

---

## 🚀 Future Enhancements

* 🔮 Advanced ML-based fraud prediction
* 📡 Live GPS tracking
* 🔗 Integration with delivery platforms (Swiggy, Zomato), for now it is simulated only
* 🔊 Voice-based emergency alerts
* 🧠 AI chatbot for assistance

---

## 🌍 Impact

* Provides financial security to gig workers
* Reduces income uncertainty
* Promotes micro-insurance adoption
* Supports India’s gig economy


---

## 🏆 Hackathon Submission

Developed for:
**Guidewire DEVTrails University Hackathon 2026**

---

## 📜 License

This project is created for educational and hackathon purposes.

---

## ❤️ Acknowledgements

* Open-source community
* Hackathon organizers
* Cybersecurity & AI research resources

---

## 🏢 About the Creator

This project was built and published under my personal brand, **Softgrid Technologies**. It is an independent, complete project created for professional development and hackathons.

* 🌐 **Website:** [softgridtechnologies.site](https://softgridtechnologies.site)
* ✉️ **Contact:** softgridtechnologies@gmail.com

---

## ⭐ Support

If you like this project, give it a ⭐ on GitHub!
