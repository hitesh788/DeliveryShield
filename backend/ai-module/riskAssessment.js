/**
 * AI Module: Risk Assessment
 * Calculates dynamic weekly premium and live weather insights.
 */
const BASE_RISK_RATE = 0.02; // 2% of average weekly income

const CITY_RISK_MULTIPLIERS = {
    'Mumbai': 1.4,
    'Delhi': 1.5,
    'Bangalore': 1.2,
    'Chennai': 1.3,
    'default': 1.0
};

exports.calculateWeeklyPremium = (averageWeeklyIncome, city) => {
    const multiplier = CITY_RISK_MULTIPLIERS[city] || CITY_RISK_MULTIPLIERS['default'];
    const riskFactor = parseFloat((multiplier * (1 + Math.random() * 0.1)).toFixed(2));

    const weeklyPremium = Math.round(averageWeeklyIncome * BASE_RISK_RATE * riskFactor);
    const incomeCovered = Math.round(averageWeeklyIncome * 0.8);

    return {
        weeklyPremium,
        incomeCovered,
        riskFactor
    };
};

exports.explainRisk = (averageWeeklyIncome, city, weather = null) => {
    const notes = [];

    if (weather) {
        if (weather.temp > 35) notes.push(`Extreme Heat Detected (${weather.temp}°C): High risk of exhaustion.`);
        if (weather.condition === 'Rain' || weather.condition === 'Thunderstorm') notes.push(`Active Rainfall: Road slickness and delivery delays probable.`);
        if (weather.aqi >= 4) notes.push(`Unsafe Air Quality (AQI ${weather.aqi}): Respiratory risk alert for outdoor workers.`);
    }

    const cityNotes = {
        Mumbai: ['High rainfall probability', 'Waterlogging disruption risk'],
        Delhi: ['High pollution exposure', 'Heatwave probability'],
        Bangalore: ['Rain and traffic disruption risk', 'Moderate income volatility'],
        Chennai: ['Heat and rain disruption risk', 'Coastal weather exposure']
    };

    const baseNotes = cityNotes[city] || ['Standard city risk profile'];
    notes.push(...baseNotes);

    if (averageWeeklyIncome >= 6000) notes.push('Higher income protection requirement');
    return notes;
};

exports.recommendPlan = (averageWeeklyIncome, city, weather = null) => {
    // Dynamic recommendation based on live risk
    if (weather && (weather.temp > 38 || weather.aqi > 4)) return 'ELITE CORP';
    if (averageWeeklyIncome >= 7000) return 'ELITE CORP';
    if (city === 'Delhi' || city === 'Mumbai' || (weather && weather.condition === 'Rain')) return 'PRO LEVEL';
    if (averageWeeklyIncome >= 4000) return 'PRO LEVEL';
    return 'BETA PLAN';
};

exports.getPredictiveAlerts = (city, weather = null) => {
    const alerts = [];

    if (weather) {
        if (weather.temp > 36) alerts.push(`HEAT ALERT: Mandatory hydration breaks recommended for ${city} workers.`);
        if (weather.condition === 'Rain') alerts.push(`RAIN WARNING: Flash waterlogging possible in low-lying ${city} zones.`);
    }

    const cityAlerts = {
        Mumbai: ['Heavy rain risk may rise this week', 'Keep rain disruption coverage active'],
        Delhi: ['AQI may cross unsafe levels', 'Heat risk can increase during afternoon shifts'],
        Bangalore: ['Evening rain may affect delivery windows', 'Traffic gridlock risk is moderate'],
        Chennai: ['Heat exposure risk is elevated', 'Coastal rain can trigger short delivery outages']
    };

    const baseAlerts = cityAlerts[city] || ['No major city-specific alert right now'];
    alerts.push(...baseAlerts);

    return alerts;
};
