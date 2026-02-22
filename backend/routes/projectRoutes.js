const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { createProjectValidation } = require("../middleware/validators/projectValidator");
const {
    createProject,
    getMyProjects,
    getProjectById,
    reevaluateProject,
} = require("../controllers/projectController");

const router = express.Router();



router.post("/", protect, createProjectValidation, createProject);
router.get("/", protect, getMyProjects);
router.get("/:id", protect, getProjectById);
router.post("/:id/reevaluate", protect, reevaluateProject);

module.exports = router;
