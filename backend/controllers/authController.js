const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
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
exports.registerUser = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ success: false, message: "Email already registered" });
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

    res.status(201).json(buildUserResponse(user, generateToken(user._id)));
  } catch (error) {
    next(error);
  }
};

// ── POST /api/auth/login ──────────────────────────────────────────────────────
exports.loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    logger.info(`[authController] User logged in: ${email}`);

    res.json(buildUserResponse(user, generateToken(user._id)));
  } catch (error) {
    next(error);
  }
};

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("-password -__v");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};