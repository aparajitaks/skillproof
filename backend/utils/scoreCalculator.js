const WEIGHTS = {
    architecture: 0.4,
    scalability: 0.3,
    codeQuality: 0.3,
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
 * The AI never determines this value — only the weighted formula does.
 *
 * @param {object} scores
 * @param {number} scores.architectureScore
 * @param {number} scores.scalabilityScore
 * @param {number} scores.codeQualityScore
 * @returns {number} finalScore (0 if any score is invalid)
 */
const calculateFinalScore = ({ architectureScore, scalabilityScore, codeQualityScore }) => {
    console.log("[scoreCalculator] Input scores:", { architectureScore, scalabilityScore, codeQualityScore });

    if (
        !isValidScore(architectureScore) ||
        !isValidScore(scalabilityScore) ||
        !isValidScore(codeQualityScore)
    ) {
        console.warn("[scoreCalculator] ⚠️  One or more scores are invalid (0 or out of range) — returning finalScore: 0");
        return 0;
    }

    const raw =
        architectureScore * WEIGHTS.architecture +
        scalabilityScore * WEIGHTS.scalability +
        codeQualityScore * WEIGHTS.codeQuality;

    const finalScore = Math.round(raw);
    console.log("[scoreCalculator] ✅ finalScore:", finalScore);
    return finalScore;
};

module.exports = { calculateFinalScore };
