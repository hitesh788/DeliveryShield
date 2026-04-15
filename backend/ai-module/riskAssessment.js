/**
 * AI Module: Risk Assessment
 * Calculates dynamic weekly premium based on average income and city's risk profile.
 */
const BASE_RISK_RATE = 0.02; // 2% of average weekly income

const CITY_RISK_MULTIPLIERS = {
    'Mumbai': 1.4, // High rain risk
    'Delhi': 1.5, // High pollution & heat
    'Bangalore': 1.2, // Rain/traffic
    'Chennai': 1.3, // Heat/rain
    'default': 1.0
};

exports.calculateWeeklyPremium = (averageWeeklyIncome, city) => {
    const multiplier = CITY_RISK_MULTIPLIERS[city] || CITY_RISK_MULTIPLIERS['default'];
    const riskFactor = parseFloat((multiplier * (1 + Math.random() * 0.1)).toFixed(2)); // slight dynamic random factor (simulating real-time data)

    const weeklyPremium = Math.round(averageWeeklyIncome * BASE_RISK_RATE * riskFactor);
    const incomeCovered = Math.round(averageWeeklyIncome * 0.8); // Cover up to 80% of weekly income

    return {
        weeklyPremium,
        incomeCovered,
        riskFactor
    };
};

exports.explainRisk = (averageWeeklyIncome, city) => {
    const cityNotes = {
        Mumbai: ['High rainfall probability', 'Waterlogging disruption risk'],
        Delhi: ['High pollution exposure', 'Heatwave probability'],
        Bangalore: ['Rain and traffic disruption risk', 'Moderate income volatility'],
        Chennai: ['Heat and rain disruption risk', 'Coastal weather exposure']
    };

    const notes = cityNotes[city] || ['Standard city risk profile'];
    if (averageWeeklyIncome >= 6000) notes.push('Higher income protection requirement');
    if (averageWeeklyIncome < 3000) notes.push('Low premium band selected for affordability');
    return notes;
};

exports.recommendPlan = (averageWeeklyIncome, city) => {
    if (averageWeeklyIncome >= 7000) return 'ELITE CORP';
    if (city === 'Delhi' || city === 'Mumbai') return 'PRO LEVEL';
    if (averageWeeklyIncome >= 4000) return 'PRO LEVEL';
    return 'BETA PLAN';
};

exports.getPredictiveAlerts = (city) => {
    const alerts = {
        Mumbai: ['Heavy rain risk may rise this week', 'Keep rain disruption coverage active'],
        Delhi: ['AQI may cross unsafe levels', 'Heat risk can increase during afternoon shifts'],
        Bangalore: ['Evening rain may affect delivery windows', 'Traffic gridlock risk is moderate'],
        Chennai: ['Heat exposure risk is elevated', 'Coastal rain can trigger short delivery outages']
    };

    return alerts[city] || ['No major city-specific alert right now'];
};
