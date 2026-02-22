/**
 * asyncHandler — wraps async route handlers so errors propagate to
 * Express's centralized error middleware without explicit try/catch.
 *
 * Usage:
 *   router.get('/path', asyncHandler(async (req, res) => { ... }));
 */
const asyncHandler = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
