const { z } = require("zod");
const logger = require("../utils/logger");

const envSchema = z.object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    PORT: z.string().default("5001"),
    MONGO_URI: z.string().min(1, "MONGO_URI is required"),
    JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
    GROQ_API_KEY: z.string().optional(),
    OPENAI_API_KEY: z.string().optional(), // In case of multi-model logic later
    CORS_ORIGIN: z.string().optional(),
    SIMULATE_AI_FAILURE: z.string().optional(),
});

function validateEnv() {
    try {
        const envVars = envSchema.parse(process.env);

        // Require GROQ_API_KEY unless explicitly simulating AI failures
        const simulateAI = envVars.SIMULATE_AI_FAILURE === "true";
        if (!simulateAI && !envVars.GROQ_API_KEY) {
            throw new Error("GROQ_API_KEY is required unless SIMULATE_AI_FAILURE=true");
        }

        if (envVars.NODE_ENV === "production" && envVars.JWT_SECRET === "change_this_in_production") {
            logger.warn("[env] JWT_SECRET is using the default placeholder in production!");
        }

        logger.info("[env] Environment variables validated successfully.");
        return envVars;
    } catch (error) {
        console.error("[env] Environment validation failed:");
        if (error.errors) {
            error.errors.forEach((err) => {
                console.error(`  - ${err.path.join(".")}: ${err.message}`);
            });
        } else {
            console.error(`  - ${error.message}`);
        }
        process.exit(1);
    }
}

module.exports = { validateEnv };
