/**
 * Deterministic final score calculator.
 *
 * The server always owns the final score — the AI provides sub-scores
 * and we combine them with a stable weighted formula. This means:
 * - Scores are reproducible
 * - Weights can be adjusted without retraining models
 * - Results are auditable and interview-explainable
 *
 * Formula: weighted sum → normalized to 0–100
 * Weights must add up to 1.0
 */
const logger = require("./logger");

const WEIGHTS = {
    architecture: 0.25,
    scalability: 0.20,
    codeQuality: 0.25,
    innovation: 0.15,
    realWorldImpact: 0.15,
};

// Version this so changes to the formula can be tracked
const SCORE_VERSION = "v1.1";

const SCORE_MIN = 1;
const SCORE_MAX = 10;

const isValidScore = (score) =>
    typeof score === "number" &&
    !isNaN(score) &&
    score >= SCORE_MIN &&
    score <= SCORE_MAX;

/**
 * Calculates a deterministic final score from AI sub-scores.
 * Returns a 0–100 integer. Returns 0 if any required score is invalid.
 *
 * @param {object} scores
 * @returns {number} finalScore (0–100)
 */
const calculateFinalScore = ({
    architectureScore,
    scalabilityScore,
    codeQualityScore,
    innovationScore,
    realWorldImpactScore,
}) => {
    if (
        !isValidScore(architectureScore) ||
        !isValidScore(scalabilityScore) ||
        !isValidScore(codeQualityScore) ||
        !isValidScore(innovationScore) ||
        !isValidScore(realWorldImpactScore)
    ) {
        logger.warn("[scoreCalculator] ⚠️ One or more scores are invalid — returning 0");
        return 0;
    }

    const rawOutOfTen =
        architectureScore * WEIGHTS.architecture +
        scalabilityScore * WEIGHTS.scalability +
        codeQualityScore * WEIGHTS.codeQuality +
        innovationScore * WEIGHTS.innovation +
        realWorldImpactScore * WEIGHTS.realWorldImpact;

    // Normalize to 0–100 for better UX (more granular display)
    const finalScore = Math.round(rawOutOfTen * 10);
    logger.info(`[scoreCalculator] ✅ finalScore: ${finalScore}/100 (raw: ${rawOutOfTen.toFixed(2)}/10)`);
    return finalScore;
};

module.exports = { calculateFinalScore, WEIGHTS, SCORE_VERSION };
