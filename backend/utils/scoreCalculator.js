/**
 * Deterministic final score calculator.
 *
 * The server always owns the final score — the AI provides sub-scores
 * and we combine them with a stable weighted formula. This means:
 * - Scores are reproducible
 * - Weights can be adjusted without retraining models
 * - Results are auditable and interview-explainable
 *
 * Formula: weighted sum (0–10 range from AI) → normalized to 0–9
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
const SCORE_VERSION = "v2.0";

// AI sub-scores are expected on 0–9 scale
const SCORE_MIN = 0;
const SCORE_MAX = 9;

const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

const isValidScore = (score) =>
    typeof score === "number" &&
    !isNaN(score) &&
    score >= SCORE_MIN &&
    score <= SCORE_MAX;

/**
 * Calculates a deterministic final score from AI sub-scores.
 * Returns a 0–9 integer. Returns 0 if any required score is invalid.
 *
 * @param {object} scores
 * @returns {number} finalScore (0–9)
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

    // Weighted average of 0–9 scores → still 0–9
    const rawWeightedAvg =
        architectureScore * WEIGHTS.architecture +
        scalabilityScore * WEIGHTS.scalability +
        codeQualityScore * WEIGHTS.codeQuality +
        innovationScore * WEIGHTS.innovation +
        realWorldImpactScore * WEIGHTS.realWorldImpact;

    // Round and clamp to guarantee integer in [0, 9]
    const finalScore = clamp(Math.round(rawWeightedAvg), SCORE_MIN, SCORE_MAX);
    logger.info(`[scoreCalculator] ✅ finalScore: ${finalScore}/9 (raw weighted avg: ${rawWeightedAvg.toFixed(2)})`);
    return finalScore;
};

module.exports = { calculateFinalScore, WEIGHTS, SCORE_VERSION, SCORE_MIN, SCORE_MAX, clamp };
