const Groq = require("groq-sdk");
const logger = require("../utils/logger");

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

const TIMEOUT_MS = 30_000;

// ── Versioning — increment PROMPT_VERSION when prompt changes ─────────────────
// This is stored on every evaluation for reproducibility + debugging
const AI_MODEL = "llama-3.3-70b-versatile";
const AI_TEMPERATURE = 0.2;
const PROMPT_VERSION = "v3.0";

const FORCE_FAILURE = process.env.SIMULATE_AI_FAILURE === "true";

// ── System prompt ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `
You are a senior software engineering evaluator for a developer career intelligence platform.

Evaluate the submitted project and return ONLY a valid JSON object with EXACTLY these keys:

{
  "architectureScore": <integer 0-9>,
  "codeQualityScore": <integer 0-9>,
  "scalabilityScore": <integer 0-9>,
  "innovationScore": <integer 0-9>,
  "realWorldImpactScore": <integer 0-9>,
  "complexity": <integer 0-9>,
  "confidenceScore": <integer 0-100>,
  "skillTags": ["tag1", "tag2", "tag3"],
  "strengths": ["one genuine strength", "another strength"],
  "weaknesses": ["one genuine weakness", "another weakness"],
  "improvements": ["concrete next step 1", "concrete next step 2", "concrete next step 3"],
  "resumeBullets": [
    "Built a [specific thing] using [tech] that [measurable outcome or capability]",
    "Designed [architecture pattern] enabling [specific benefit]"
  ],
  "nextLearningPath": ["Learn X to improve Y", "Add Z to address weakness in W"],
  "companyFit": {
    "google": <integer 0-9>,
    "startup": <integer 0-9>,
    "mnc": <integer 0-9>
  }
}

Scoring rubric — all dimensions use 0–9 scale:
- 0–2: Basic (beginner-level, proof of concept)
- 3–5: Intermediate (functional, room to grow)
- 6–9: Advanced (production-ready, well-architected)

Dimension definitions:
- architectureScore: separation of concerns, patterns, modularity
- codeQualityScore: readability, naming, test coverage, maintainability
- scalabilityScore: ability to handle growth, stateless design, DB indexing
- innovationScore: creative use of technology, novel solutions, originality
- realWorldImpactScore: solves a real problem, has users, production potential
- complexity: overall technical complexity of the project (0–9)
- confidenceScore: your confidence (0–100) in the accuracy of this evaluation given the info provided

Company-fit scoring (0–9 scale):
- google: algorithmic thinking, large-scale systems design, rigorous code quality
- startup: fast to ship, pragmatic, user-focused, MVP-minded
- mnc: enterprise patterns, documentation, security, maintainability standards

Rules:
- resumeBullets must be copy-paste ready for LinkedIn or a resume. No placeholders.
- strengths and weaknesses must be specific to THIS project, not generic.
- Return ONLY the JSON object. No markdown, no explanation, no text outside the JSON.
`.trim();

const FALLBACK_EVALUATION = {
    architectureScore: 0,
    codeQualityScore: 0,
    scalabilityScore: 0,
    innovationScore: 0,
    realWorldImpactScore: 0,
    complexity: 0,
    confidenceScore: 0,
    skillTags: [],
    strengths: [],
    weaknesses: [],
    improvements: ["AI evaluation temporarily unavailable. Please resubmit later."],
    resumeBullets: [],
    nextLearningPath: [],
    companyFit: { google: 0, startup: 0, mnc: 0 },
    // Metadata
    aiModelVersion: AI_MODEL,
    promptVersion: PROMPT_VERSION,
    tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
    fallback: true,
};

/**
 * Calls Groq to evaluate a project across 5 dimensions + company-fit + confidence.
 * All scores returned on 0–9 scale (except confidenceScore which is 0–100).
 * Always returns a value — never throws.
 * Returns token usage for cost tracking.
 */
const evaluateProject = async ({ title, description, techStack, githubUrl }) => {
    logger.info(`[aiService] evaluateProject: "${title}" | model: ${AI_MODEL} | prompt: ${PROMPT_VERSION}`);

    if (FORCE_FAILURE) {
        logger.warn("[aiService] 🧪 SIMULATE_AI_FAILURE=true — returning fallback");
        return FALLBACK_EVALUATION;
    }

    const userPrompt = `
Project Title: ${title}
GitHub URL: ${githubUrl}
Tech Stack: ${(techStack || []).join(", ") || "Not specified"}
Description: ${description}
`.trim();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
        const response = await client.chat.completions.create(
            {
                model: AI_MODEL,
                temperature: AI_TEMPERATURE,
                response_format: { type: "json_object" },
                messages: [
                    { role: "system", content: SYSTEM_PROMPT },
                    { role: "user", content: userPrompt },
                ],
            },
            { signal: controller.signal }
        );

        const raw = response.choices[0]?.message?.content;
        if (!raw) {
            logger.error("[aiService] ❌ Groq returned empty content");
            return FALLBACK_EVALUATION;
        }

        const parsed = JSON.parse(raw);

        // Attach AI metadata to the result
        const usage = response.usage || {};
        parsed.aiModelVersion = AI_MODEL;
        parsed.promptVersion = PROMPT_VERSION;
        parsed.tokenUsage = {
            promptTokens: usage.prompt_tokens || 0,
            completionTokens: usage.completion_tokens || 0,
            totalTokens: usage.total_tokens || 0,
        };
        parsed.fallback = false;

        logger.info(`[aiService] ✅ Evaluation complete | tokens: ${usage.total_tokens || 0} | confidence: ${parsed.confidenceScore}%`);
        return parsed;

    } catch (error) {
        logger.error(`[aiService] ❌ Groq call failed: ${error.name} — ${error.message}`);
        if (error.name === "AbortError") {
            logger.error(`[aiService] ⏱ Timed out after ${TIMEOUT_MS}ms`);
        }
        return FALLBACK_EVALUATION;
    } finally {
        clearTimeout(timeout);
    }
};

module.exports = { evaluateProject, FALLBACK_EVALUATION, AI_MODEL, PROMPT_VERSION };
