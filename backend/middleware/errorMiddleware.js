const logger = require("../utils/logger");

/**
 * Centralized error handler — must be the last middleware in server.js.
 *
 * Handles:
 * - Mongoose CastError (bad ObjectId) → 400
 * - Mongoose ValidationError → 422
 * - MongoDB duplicate key (11000) → 409
 * - JWT errors → 401
 * - Everything else → 500
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  let message = err.message || "Internal Server Error";
  let code = "SERVER_ERROR";
  let errors = null;

  // ── Mongoose bad ObjectId ─────────────────────────────────────────────────
  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid value for field '${err.path}': ${err.value}`;
    code = "INVALID_ID";
  }

  // ── Mongoose validation error ─────────────────────────────────────────────
  if (err.name === "ValidationError") {
    statusCode = 422;
    message = "Validation failed";
    code = "VALIDATION_ERROR";
    errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }

  // ── MongoDB duplicate key ─────────────────────────────────────────────────
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    statusCode = 409;
    message = `A record with this ${field} already exists`;
    code = "DUPLICATE_KEY";
  }

  // ── JWT errors ───────────────────────────────────────────────────────────
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token";
    code = "INVALID_TOKEN";
  }
  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired";
    code = "TOKEN_EXPIRED";
  }

  logger.error(`[${statusCode}] ${req.method} ${req.originalUrl} — ${message}`, {
    code,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });

  res.status(statusCode).json({
    success: false,
    message,
    code,
    ...(errors && { errors }),
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = errorHandler;