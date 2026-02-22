const mongoose = require("mongoose");

const evaluationSchema = new mongoose.Schema(
    {
        complexity: { type: Number, default: 0 },
        architectureScore: { type: Number, default: 0 },
        scalabilityScore: { type: Number, default: 0 },
        codeQualityScore: { type: Number, default: 0 },
        skillTags: { type: [String], default: [] },
        improvements: { type: [String], default: [] },
    },
    { _id: false }
);

const projectSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 120,
        },
        githubUrl: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            required: true,
            minlength: 20,
        },
        techStack: {
            type: [String],
            default: [],
        },
        evaluation: {
            type: evaluationSchema,
            default: null,
        },
        finalScore: {
            type: Number,
            default: null,
        },
        status: {
            type: String,
            enum: ["pending", "evaluated", "failed"],
            default: "pending",
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Project", projectSchema);
