const express = require("express");
const { body } = require("express-validator");
const { protect } = require("../middleware/authMiddleware");
const {
    createProject,
    getMyProjects,
    getProjectById,
} = require("../controllers/projectController");

const router = express.Router();

const GITHUB_URL_REGEX = /^https:\/\/github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+\/?$/;

const projectValidation = [
    body("title")
        .trim()
        .notEmpty()
        .withMessage("Title is required")
        .isLength({ max: 120 })
        .withMessage("Title must be 120 characters or fewer"),

    body("githubUrl")
        .trim()
        .notEmpty()
        .withMessage("GitHub URL is required")
        .matches(GITHUB_URL_REGEX)
        .withMessage("Must be a valid GitHub repository URL (https://github.com/user/repo)"),

    body("description")
        .trim()
        .notEmpty()
        .withMessage("Description is required")
        .isLength({ min: 20 })
        .withMessage("Description must be at least 20 characters"),

    body("techStack")
        .optional()
        .isArray()
        .withMessage("techStack must be an array of strings"),
];

router.post("/", protect, projectValidation, createProject);
router.get("/", protect, getMyProjects);
router.get("/:id", protect, getProjectById);

module.exports = router;
