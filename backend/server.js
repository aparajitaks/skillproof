require("dotenv").config();

// ── Boot diagnostics ──────────────────────────────────────────────────────────
const _key = process.env.GROQ_API_KEY;
console.log(
  "[boot] GROQ_API_KEY:",
  _key && _key !== "your_groq_api_key_here"
    ? `gsk_...${_key.slice(-4)} ✅`
    : "❌ MISSING or placeholder — AI evaluation will fail!"
);
// ─────────────────────────────────────────────────────────────────────────────

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const projectRoutes = require("./routes/projectRoutes");
const profileRoutes = require("./routes/profileRoutes");
const leaderboardRoutes = require("./routes/leaderboardRoutes");
const certRoutes = require("./routes/certRoutes");
const billingRoutes = require("./routes/billingRoutes");
const errorHandler = require("./middleware/errorMiddleware");
const { handleWebhook } = require("./controllers/billingController");

const app = express();

connectDB();

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);

// ── Stripe webhook — MUST be before express.json() to get raw Buffer ──────────
// Stripe requires the raw body to validate the signature
app.post(
  "/api/billing/webhook",
  express.raw({ type: "application/json" }),
  handleWebhook
);

app.use(express.json());

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// ── Rate limiters ─────────────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: "Too many auth attempts. Please try again later.",
});

const evalLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: "Too many evaluation attempts per hour.",
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: "Too many requests. Please try again later.",
});

app.use("/api/auth", authLimiter);
app.use(apiLimiter); // global fallback

// ── Routes ────────────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ message: "SkillProof API Running 🚀" });
});

app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/cert", certRoutes);           // Public cert endpoints
app.use("/api/billing", billingRoutes);     // Stripe billing (webhook handled above)

// ── Error handler — must be last ──────────────────────────────────────────────
app.use(errorHandler);

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || "development"} mode`);
});