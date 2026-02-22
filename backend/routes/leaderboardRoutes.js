const express = require("express");
const router = express.Router();
const {
    getLeaderboard,
} = require("../controllers/leaderboardController");

/**
 * GET /api/leaderboard
 * Public — no auth required.
 * Query params: page (default: 1), limit (default: 20, max: 50)
 */
router.get("/", getLeaderboard);

module.exports = router;
