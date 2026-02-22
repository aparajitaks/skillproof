// Weighted formula — server-owns the final score, AI never determines it directly.
// Weights must add up to 1.0
const WEIGHTS = {
    architecture: 0.25,
    scalability: 0.20,
    codeQuality: 0.25,
    innovation: 0.15,
    realWorldImpact: 0.15,
};

const SCORE_MIN = 1;
const SCORE_MAX = 10;

const isValidScore = (score) =>
    typeof score === "number" &&
    !isNaN(score) &&
    score >= SCORE_MIN &&
    score <= SCORE_MAX;

/**
 * Calculates the deterministic final score from AI sub-scores.
 * Uses a 5-dimension weighted formula. Returns 0 if any required score is invalid.
 *
 * @param {object} scores
 * @returns {number} finalScore (0–10)
 */
const calculateFinalScore = ({
    architectureScore,
    scalabilityScore,
    codeQualityScore,
    innovationScore,
    realWorldImpactScore,
}) => {
    console.log("[scoreCalculator] Input scores:", {
        architectureScore, scalabilityScore, codeQualityScore,
        innovationScore, realWorldImpactScore,
    });

    if (
        !isValidScore(architectureScore) ||
        !isValidScore(scalabilityScore) ||
        !isValidScore(codeQualityScore) ||
        !isValidScore(innovationScore) ||
        !isValidScore(realWorldImpactScore)
    ) {
        console.warn("[scoreCalculator] ⚠️  One or more scores are invalid — returning 0");
        return 0;
    }

    const raw =
        architectureScore * WEIGHTS.architecture +
        scalabilityScore * WEIGHTS.scalability +
        codeQualityScore * WEIGHTS.codeQuality +
        innovationScore * WEIGHTS.innovation +
        realWorldImpactScore * WEIGHTS.realWorldImpact;

    const finalScore = Math.round(raw);
    console.log("[scoreCalculator] ✅ finalScore:", finalScore);
    return finalScore;
};

module.exports = { calculateFinalScore };
