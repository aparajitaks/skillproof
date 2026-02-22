const { z } = require("zod");

const registerSchema = z.object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(50, "Name must be 50 characters or fewer"),
    email: z.string().trim().email("Please include a valid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

const loginSchema = z.object({
    email: z.string().trim().email("Please include a valid email"),
    password: z.string().min(1, "Password is required"),
});

module.exports = {
    registerSchema,
    loginSchema,
};
