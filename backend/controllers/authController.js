const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const asyncHandler = require("../utils/asyncHandler");
const responseHandler = require("../utils/responseHandler");
const User = require("../models/User");
const logger = require("../utils/logger");

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

const buildUserResponse = (user, token) => ({
  success: true,
  token,
  user: {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    publicProfileSlug: user.publicProfileSlug,
    publicProfileEnabled: user.publicProfileEnabled,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    aiTokensUsed: user.aiTokensUsed,
  },
});

// ── POST /api/auth/register ───────────────────────────────────────────────────
exports.registerUser = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return responseHandler.error(res, "Validation failed", "VALIDATION_ERROR", 400, errors.array());
  }

  const { name, email, password } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return responseHandler.error(res, "Email already registered", "CONFLICT", 409);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  // Auto-generate a unique public profile slug: firstname + 4-char hex
  const baseSlug = name.split(" ")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
  const suffix = Math.random().toString(16).slice(2, 6);
  const publicProfileSlug = `${baseSlug}-${suffix}`;

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    publicProfileSlug,
  });

  logger.info(`[authController] New user registered: ${email}`);

  return responseHandler.success(res, { ...buildUserResponse(user, generateToken(user._id)) }, 201);
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────
exports.loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return responseHandler.error(res, "Invalid credentials", "UNAUTHORIZED", 401);
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return responseHandler.error(res, "Invalid credentials", "UNAUTHORIZED", 401);
  }

  logger.info(`[authController] User logged in: ${email}`);

  return responseHandler.success(res, { ...buildUserResponse(user, generateToken(user._id)) });
});

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("-password -__v");
  if (!user) {
    return responseHandler.error(res, "User not found", "NOT_FOUND", 404);
  }
  return responseHandler.success(res, { user });
});