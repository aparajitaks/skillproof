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
const errorHandler = require("./middleware/errorMiddleware");

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

app.use(express.json());

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests. Please try again later.",
});
app.use(limiter);


app.get("/", (req, res) => {
  res.json({ message: "SkillProof API Running 🚀" });
});

app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/profile", profileRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});