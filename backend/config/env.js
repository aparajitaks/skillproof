const { z } = require("zod");
const logger = require("../utils/logger");

const envSchema = z.object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    PORT: z.string().default("5001"),
    MONGO_URI: z.string().min(1, "MONGO_URI is required"),
    JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
    GROQ_API_KEY: z.string().min(1, "GROQ_API_KEY is required"),
    OPENAI_API_KEY: z.string().optional(), // In case of multi-model logic later
    CORS_ORIGIN: z.string().optional(),
});

function validateEnv() {
    try {
        const envVars = envSchema.parse(process.env);

        if (envVars.NODE_ENV === "production" && envVars.JWT_SECRET === "change_this_in_production") {
            logger.warn("[env] JWT_SECRET is using the default placeholder in production!");
        }

        logger.info("[env] Environment variables validated successfully.");
        return envVars;
    } catch (error) {
        console.error("[env] Environment validation failed:");
        error.errors.forEach((err) => {
            console.error(`  - ${err.path.join(".")}: ${err.message}`);
        });
        process.exit(1);
    }
}

module.exports = { validateEnv };
