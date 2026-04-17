/**
 * AI Module: Fraud Detection
 * Simple rule-based/mock ML logic to detect fraudulent claims.
 */

exports.calculateFraudScore = (user, claimDetails) => {
    let score = 0;

    // New Rule: OpenWeather API Mock check for "Extreme Heat"
    // Let's pretend our backend checked an API and found that today's temp is only 32C.
    if (claimDetails.disruptionType === 'Extreme Heat') {
        // A strict reject because the temperature API returned 32C which is not extreme (needs 40C+).
        score += 100;
    }

    // Rule 1: Claim filed multiple times in the same week (Mock logic)
    if (Math.random() > 0.9) {
        score += 50;
    }

    // Rule 2: GPS Location mismatch (Mock: User registered in Mumbai but claiming disruption in Delhi)
    if (Math.random() > 0.95) {
        score += 40;
    }

    // Ensure score is valid
    const finalScore = Math.min(score, 100);
    const isFraudulent = finalScore >= 70;

    return { score: finalScore, isFraudulent };
};
