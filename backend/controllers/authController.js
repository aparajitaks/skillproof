const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const User = require("../models/User");

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

    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Auto-generate a unique profile slug: firstname + random 4-char hex
    const baseSlug = name.split(" ")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
    const suffix = Math.random().toString(16).slice(2, 6);
    const publicProfileSlug = `${baseSlug}-${suffix}`;

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      publicProfileSlug,
    });

    res.status(201).json({
      id: user._id,
      name: user.name,
      email: user.email,
      plan: user.plan,
      publicProfileSlug: user.publicProfileSlug,
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
      token: generateToken(user._id),
    });
  } catch (error) {
    next(error);
  }
};