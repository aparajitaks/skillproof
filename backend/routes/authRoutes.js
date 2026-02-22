const express = require("express");
const { body } = require("express-validator");
const { registerUser, loginUser, verifyEmail } = require("../controllers/authController");

const router = express.Router();

router.post(
  "/register",
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ],
  registerUser
);

router.post("/login", loginUser);

// Email verification (token sent via email, link clicks here)
router.get("/verify-email", verifyEmail);

module.exports = router;