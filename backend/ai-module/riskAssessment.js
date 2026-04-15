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
