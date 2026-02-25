const authService = require("../services/authService");
const { validationResult } = require("express-validator");
const asyncHandler = require("../utils/asyncHandler");
const responseHandler = require("../utils/responseHandler");
const userRepository = require("../repositories/userRepository");
const logger = require("../utils/logger");

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

  const { user, token } = await authService.registerUser(req.body);

  logger.info(`[authController] New user registered: ${user.email}`);

  return responseHandler.success(res, { ...buildUserResponse(user, token) }, 201);
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────
exports.loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const { user, token } = await authService.loginUser(email, password);

  logger.info(`[authController] User logged in: ${email}`);

  return responseHandler.success(res, { ...buildUserResponse(user, token) });
});

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
exports.getMe = asyncHandler(async (req, res) => {
  const user = await userRepository.findById(req.user.id);
  if (!user) {
    return responseHandler.error(res, "User not found", "NOT_FOUND", 404);
  }
  return responseHandler.success(res, { user });
});