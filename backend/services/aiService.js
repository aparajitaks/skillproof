const OpenAI = require("openai");

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const TIMEOUT_MS = 30_000;
const AI_MODEL = "gpt-4o-mini";
const AI_TEMPERATURE = 0.2;

// Set SIMULATE_AI_FAILURE=true in .env to force fallback without a real API call
const FORCE_FAILURE = process.env.SIMULATE_AI_FAILURE === "true";

const SYSTEM_PROMPT = `
You are a senior software engineering evaluator for a developer skill platform.

Evaluate the submitted project and return ONLY valid JSON with these exact keys:

{
  "complexity": <integer 1-10>,
  "architectureScore": <integer 1-10>,
  "scalabilityScore": <integer 1-10>,
  "codeQualityScore": <integer 1-10>,
  "skillTags": ["tag1", "tag2", "tag3"],
  "improvements": ["suggestion1", "suggestion2", "suggestion3"]
}

Scoring rubric:
- 1–3: Basic — beginner-level implementation, limited design thought
- 4–6: Intermediate — functional, some structure, room for improvement
- 7–10: Advanced — production-ready, well-architected, scalable

Do not include any explanation outside the JSON object.
`.trim();

const FALLBACK_EVALUATION = {
    complexity: 0,
    architectureScore: 0,
    scalabilityScore: 0,
    codeQualityScore: 0,
    skillTags: [],
    improvements: ["AI evaluation temporarily unavailable. Please resubmit later."],
};

/**
 * Calls OpenAI to evaluate a submitted project.
 * Returns a structured evaluation object or a fallback if the call fails.
 *
 * @param {{ title: string, description: string, techStack: string[], githubUrl: string }} project
 * @returns {Promise<object>} evaluation
 */
const evaluateProject = async ({ title, description, techStack, githubUrl }) => {
    // ── Debug: log what we received ───────────────────────────────────────────
    console.log("[aiService] evaluateProject called:", {
        title,
        githubUrl,
        techStack,
        description: description?.slice(0, 80),
    });
    const keySnippet = process.env.OPENAI_API_KEY?.slice(-4) ?? "NONE";
    console.log("[aiService] Using API key ending in:", keySnippet);
    // ─────────────────────────────────────────────────────────────────────────

    // Simulation mode — bypass real API call
    if (FORCE_FAILURE) {
        console.warn("[aiService] 🧪 SIMULATE_AI_FAILURE=true — returning fallback without calling OpenAI");
        return FALLBACK_EVALUATION;
    }

    const userPrompt = `
Project Title: ${title}
GitHub URL: ${githubUrl}
Tech Stack: ${techStack.join(", ") || "Not specified"}
Description: ${description}
  `.trim();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
        console.log("[aiService] Sending request to OpenAI...");
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
        console.log("[aiService] Raw OpenAI response:", raw);

        if (!raw) {
            console.error("[aiService] ❌ OpenAI returned empty content");
            return FALLBACK_EVALUATION;
        }

        const parsed = JSON.parse(raw);
        console.log("[aiService] ✅ Parsed evaluation:", parsed);
        return parsed;

    } catch (error) {
        // ── Expose the full real OpenAI error ─────────────────────────────────
        console.error("[aiService] ❌ OpenAI call failed");
        console.error("[aiService]   name    :", error.name);
        console.error("[aiService]   message :", error.message);
        console.error("[aiService]   status  :", error.status);   // 401, 429, 500 etc.
        console.error("[aiService]   type    :", error.type);     // "invalid_api_key" etc.
        if (error.name === "AbortError") {
            console.error("[aiService]   ⏱ Request timed out after", TIMEOUT_MS, "ms");
        }
        if (error.error) {
            // OpenAI SDK wraps the API error object here
            console.error("[aiService]   API error body:", JSON.stringify(error.error, null, 2));
        }
        // ─────────────────────────────────────────────────────────────────────
        return FALLBACK_EVALUATION;
    } finally {
        clearTimeout(timeout);
    }
};

module.exports = { evaluateProject };
