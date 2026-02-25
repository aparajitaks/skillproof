const logger = require("../utils/logger");
const responseHandler = require("../utils/responseHandler");

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
  // Use error's statusCode if set, otherwise check res.statusCode, default to 500
  let statusCode = err.statusCode || (res.statusCode && res.statusCode !== 200 ? res.statusCode : 500);
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

  // ── Custom statusCode errors (from services) ──────────────────────────────
  if (err.statusCode === 409 && code === "SERVER_ERROR") {
    code = "DUPLICATE_KEY";
  }
  if (err.statusCode === 401 && code === "SERVER_ERROR") {
    code = "UNAUTHORIZED";
  }
  if (err.statusCode === 404 && code === "SERVER_ERROR") {
    code = "NOT_FOUND";
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

  return responseHandler.error(
    res,
    message,
    code,
    statusCode,
    errors || (process.env.NODE_ENV === "development" ? { stack: err.stack } : null)
  );
};

module.exports = errorHandler;