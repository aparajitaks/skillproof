/**
 * make-admin.js
 *
 * Promotes a user to admin role by email.
 *
 * Usage:
 *   node scripts/make-admin.js your@email.com
 */

require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const User = require("../models/User");

const email = process.argv[2];
if (!email) {
    console.error("❌ Usage: node scripts/make-admin.js <email>");
    process.exit(1);
}

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const user = await User.findOneAndUpdate(
        { email: email.toLowerCase() },
        { $set: { role: "admin" } },
        { new: true }
    );

    if (!user) {
        console.error(`❌ No user found with email: ${email}`);
        process.exit(1);
    }

    console.log(`✅ ${user.name} (${user.email}) promoted to admin`);
    await mongoose.disconnect();
    process.exit(0);
}

run().catch((err) => {
    console.error("❌ Error:", err.message);
    process.exit(1);
});
