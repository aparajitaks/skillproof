const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { validate } = require("../middleware/validators/zodValidation");
const { registerSchema, loginSchema } = require("../middleware/validators/authSchema");
const { registerUser, loginUser, getMe } = require("../controllers/authController");

const router = express.Router();

router.post("/register", validate(registerSchema), registerUser);
router.post("/login", validate(loginSchema), loginUser);
router.get("/me", protect, getMe);

module.exports = router;