/**
 * Environment variable validator — called at boot.
 * Throws immediately if any required variable is missing so the server
 * fails fast with a clear error rather than crashing silently later.
 */

const REQUIRED_VARS = [
    "MONGO_URI",
    "JWT_SECRET",
    "GROQ_API_KEY",
];

function validateEnv() {
    const missing = REQUIRED_VARS.filter((key) => !process.env[key]);
    if (missing.length > 0) {
        console.error(
            `\n[env] ❌ Missing required environment variables:\n  ${missing.join("\n  ")}\n\nCopy .env.example to .env and fill in the values.\n`
        );
        process.exit(1);
    }

    // Warn about placeholder values
    if (process.env.JWT_SECRET === "change_this_in_production") {
        console.warn("[env] ⚠️  JWT_SECRET is using the default placeholder — change it in production!");
    }

    console.log("[env] ✅ All required environment variables present");
}

module.exports = { validateEnv };
