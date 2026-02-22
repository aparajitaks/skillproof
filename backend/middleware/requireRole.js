/**
 * requireRole — RBAC guard middleware.
 *
 * Usage:
 *   router.get('/admin/stats', authMiddleware, requireRole('admin'), handler);
 *   router.get('/recruiter', authMiddleware, requireRole('admin', 'recruiter'), handler);
 */
module.exports = (...roles) =>
    (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: "Not authenticated" });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: `Access denied. Required role(s): ${roles.join(", ")}`,
            });
        }
        next();
    };
