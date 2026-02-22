const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const requireRole = require("../middleware/requireRole");
const {
    getStats,
    getUsers,
    getProjects,
    getTokenUsage,
} = require("../controllers/adminController");

const router = express.Router();

// All admin routes require authentication AND admin role
router.use(protect, requireRole("admin"));

router.get("/stats", getStats);
router.get("/users", getUsers);
router.get("/projects", getProjects);
router.get("/token-usage", getTokenUsage);

module.exports = router;
