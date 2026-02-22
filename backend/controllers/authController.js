const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { validationResult } = require("express-validator");
const User = require("../models/User");
const { sendWelcomeEmail, sendVerificationEmail } = require("../services/emailService");

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// Register
exports.registerUser = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, ref } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Auto-generate a unique profile slug: firstname + random 4-char hex
    const baseSlug = name.split(" ")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
    const suffix = Math.random().toString(16).slice(2, 6);
    const publicProfileSlug = `${baseSlug}-${suffix}`;

    // Referral code: 8-char hex unique per user
    const referralCode = crypto.randomBytes(4).toString("hex");

    // Email verification token
    const emailVerifyToken = crypto.randomBytes(32).toString("hex");

    // Resolve referrer
    let referredBy = null;
    if (ref) {
      const referrer = await User.findOne({ referralCode: ref }).select("_id");
      if (referrer) referredBy = referrer._id;
    }

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      publicProfileSlug,
      referralCode,
      emailVerifyToken,
      referredBy,
    });

    // Non-blocking emails
    sendWelcomeEmail(user).catch(() => { });
    sendVerificationEmail(user, emailVerifyToken).catch(() => { });

    res.status(201).json({
      id: user._id,
      name: user.name,
      email: user.email,
      plan: user.plan,
      evaluationsUsed: user.evaluationsUsed,
      evaluationsLimit: user.evaluationsLimit,
      publicProfileSlug: user.publicProfileSlug,
      referralCode: user.referralCode,
      token: generateToken(user._id),
    });
  } catch (error) {
    next(error);
  }
};

// Login
exports.loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      plan: user.plan,
      evaluationsUsed: user.evaluationsUsed,
      evaluationsLimit: user.evaluationsLimit,
      publicProfileSlug: user.publicProfileSlug,
      referralCode: user.referralCode,
      token: generateToken(user._id),
    });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/auth/verify-email?token=TOKEN ────────────────────────────────────
exports.verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ message: "Verification token required" });

    const user = await User.findOne({ emailVerifyToken: token });
    if (!user) return res.status(400).json({ message: "Invalid or expired verification token" });

    await User.findByIdAndUpdate(user._id, {
      emailVerified: true,
      emailVerifyToken: null,
    });

    // Redirect to frontend success page
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    res.redirect(`${frontendUrl}/dashboard?verified=true`);
  } catch (error) {
    next(error);
  }
};