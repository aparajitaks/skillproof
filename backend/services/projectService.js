const Project = require("../models/Project");
const User = require("../models/User");
const { evaluateProject: runAiEvaluation } = require("./aiService");
const { fetchRepoContext } = require("./githubService");
const { calculateFinalScore } = require("../utils/scoreCalculator");
const logger = require("../utils/logger");

/**
 * Executes the full evaluation pipeline for a project
 * @param {Object} project - Mongoose project document
 * @returns {Promise<{evaluation: Object, finalScore: number, status: string}>}
 */
const runProjectEvaluation = async (project) => {
    const { title, description, techStack, githubUrl } = project;

    let githubContext = null;
    try {
        githubContext = await fetchRepoContext(githubUrl);
    } catch (err) {
        logger.warn(`[projectService] GitHub fetch failed (non-fatal): ${err.message}`);
    }

    const evaluation = await runAiEvaluation({ title, description, techStack, githubUrl }, githubContext);
    const finalScore = calculateFinalScore(evaluation);
    const status = finalScore > 0 ? "evaluated" : "failed";

    return { evaluation, finalScore, status };
};

/**
 * Formats evaluation results and updates tokens
 */
const formatEvaluationResult = async (project, evaluation, finalScore, status, userId) => {
    project.evaluation = {
        ...evaluation,
        aiModelVersion: evaluation.aiModelVersion || null,
        promptVersion: evaluation.promptVersion || null,
        tokenUsage: evaluation.tokenUsage || { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        confidenceScore: evaluation.confidenceScore || null,
        githubAnalyzed: evaluation.githubAnalyzed || false,
        evaluatedAt: new Date(),
        fallback: evaluation.fallback || false,
    };
    project.finalScore = finalScore;
    project.status = status;

    // Track AI token usage on user account
    if (evaluation.tokenUsage?.totalTokens) {
        await User.findByIdAndUpdate(userId, {
            $inc: { aiTokensUsed: evaluation.tokenUsage.totalTokens },
        });
    }

    return project;
};

module.exports = {
    runProjectEvaluation,
    formatEvaluationResult
};
