const OpenAI = require("openai");

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const TIMEOUT_MS = 30_000;
const AI_MODEL = "gpt-4o-mini";
const AI_TEMPERATURE = 0.2;

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
    const userPrompt = `
Project Title: ${title}
GitHub URL: ${githubUrl}
Tech Stack: ${techStack.join(", ") || "Not specified"}
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
        if (!raw) return FALLBACK_EVALUATION;

        const parsed = JSON.parse(raw);
        return parsed;
    } catch (error) {
        if (error.name === "AbortError") {
            console.error("[aiService] OpenAI request timed out after", TIMEOUT_MS, "ms");
        } else {
            console.error("[aiService] OpenAI call failed:", error.message);
        }
        return FALLBACK_EVALUATION;
    } finally {
        clearTimeout(timeout);
    }
};

module.exports = { evaluateProject };
