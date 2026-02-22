const Groq = require("groq-sdk");

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

const TIMEOUT_MS = 30_000;
const AI_MODEL = "llama-3.3-70b-versatile";
const AI_TEMPERATURE = 0.2;
const FORCE_FAILURE = process.env.SIMULATE_AI_FAILURE === "true";

// ── Phase 2: adds companyFit to 5-dimension evaluation ───────────────────────
const SYSTEM_PROMPT = `
You are a senior software engineering evaluator for a developer career intelligence platform.

Evaluate the submitted project and return ONLY a valid JSON object with EXACTLY these keys:

{
  "architectureScore": <integer 1-10>,
  "codeQualityScore": <integer 1-10>,
  "scalabilityScore": <integer 1-10>,
  "innovationScore": <integer 1-10>,
  "realWorldImpactScore": <integer 1-10>,
  "complexity": <integer 1-10>,
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
    "google": <integer 0-100>,
    "startup": <integer 0-100>,
    "mnc": <integer 0-100>
  }
}

Scoring rubric (all five main dimensions):
- 1–3: Basic (beginner-level)
- 4–6: Intermediate (functional, room to grow)
- 7–10: Advanced (production-ready, well-architected)

Dimension definitions:
- architectureScore: separation of concerns, patterns, modularity
- codeQualityScore: readability, naming, test coverage, maintainability
- scalabilityScore: ability to handle growth, stateless design, DB indexing
- innovationScore: creative use of technology, novel solutions, originality
- realWorldImpactScore: solves a real problem, has users, production potential

Company-fit scoring:
- google: Does this project demonstrate algorithmic thinking, large-scale systems design, and rigorous code quality? High score = would impress Google interviewers.
- startup: Is this project fast to ship, pragmatic, user-focused, and MVP-minded? High score = startup CTO would hire for this.
- mnc: Does this project follow enterprise patterns, documentation, security, and maintainability standards? High score = fits Fortune 500 codebases.

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
    skillTags: [],
    strengths: [],
    weaknesses: [],
    improvements: ["AI evaluation temporarily unavailable. Please resubmit later."],
    resumeBullets: [],
    nextLearningPath: [],
    companyFit: { google: 0, startup: 0, mnc: 0 },
};

/**
 * Calls Groq to evaluate a project across 5 dimensions + company-fit.
 * Always returns a value — never throws.
 */
const evaluateProject = async ({ title, description, techStack, githubUrl }) => {
    console.log("[aiService] evaluateProject called:", {
        title, githubUrl, techStack,
        description: description?.slice(0, 80),
    });
    console.log("[aiService] GROQ_API_KEY ending in:", process.env.GROQ_API_KEY?.slice(-4) ?? "NONE");

    if (FORCE_FAILURE) {
        console.warn("[aiService] 🧪 SIMULATE_AI_FAILURE=true — returning fallback");
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
        console.log("[aiService] Sending request to Groq (model:", AI_MODEL, ")...");

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
            console.error("[aiService] ❌ Groq returned empty content");
            return FALLBACK_EVALUATION;
        }

        const parsed = JSON.parse(raw);
        console.log("[aiService] ✅ Parsed evaluation:", JSON.stringify(parsed, null, 2));
        return parsed;

    } catch (error) {
        console.error("[aiService] ❌ Groq call failed");
        console.error("[aiService]   name    :", error.name);
        console.error("[aiService]   message :", error.message);
        if (error.name === "AbortError") {
            console.error("[aiService]   ⏱ Timed out after", TIMEOUT_MS, "ms");
        }
        if (error.error) {
            console.error("[aiService]   API error body:", JSON.stringify(error.error, null, 2));
        }
        return FALLBACK_EVALUATION;
    } finally {
        clearTimeout(timeout);
    }
};

module.exports = { evaluateProject, FALLBACK_EVALUATION };
