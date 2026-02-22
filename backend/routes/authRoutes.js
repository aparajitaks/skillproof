const express = require("express");
const { body } = require("express-validator");
const { protect } = require("../middleware/authMiddleware");
const { registerUser, loginUser, getMe } = require("../controllers/authController");

const router = express.Router();

router.post(
  "/register",
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email required"),
    body("password")
      .isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  ],
  registerUser
);

router.post("/login", loginUser);
router.get("/me", protect, getMe);

module.exports = router;