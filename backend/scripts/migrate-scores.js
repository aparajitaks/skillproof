/**
 * migrate-scores.js
 *
 * One-shot migration script: converts all existing Project documents from
 * the old 0–100 scoring scale to the new 0–9 scale.
 *
 * Formula: newScore = Math.round((oldScore / 100) * 9)  →  clamped to [0, 9]
 *
 * RUN:
 *   DRY_RUN=true  node scripts/migrate-scores.js   ← preview only
 *   node scripts/migrate-scores.js                  ← apply changes
 */

require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const Project = require("../models/Project");

const DRY_RUN = process.env.DRY_RUN === "true";

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

/** Convert a 0–100 value to 0–9 */
const to9 = (v) => {
    if (v == null || isNaN(v)) return 0;
    if (v <= 9) return clamp(v, 0, 9); // already on new scale, just clamp
    return clamp(Math.round((v / 100) * 9), 0, 9);
};

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB:", process.env.MONGO_URI);

    // Find projects that still have scores on the old (>9) scale
    const staleProjects = await Project.find({
        $or: [
            { finalScore: { $gt: 9 } },
            { "evaluation.architectureScore": { $gt: 9 } },
            { "evaluation.codeQualityScore": { $gt: 9 } },
            { "evaluation.scalabilityScore": { $gt: 9 } },
            { "evaluation.innovationScore": { $gt: 9 } },
            { "evaluation.realWorldImpactScore": { $gt: 9 } },
            { "evaluation.complexity": { $gt: 9 } },
            { "evaluation.companyFit.google": { $gt: 9 } },
            { "evaluation.companyFit.startup": { $gt: 9 } },
            { "evaluation.companyFit.mnc": { $gt: 9 } },
        ],
    });

    console.log(`\nFound ${staleProjects.length} project(s) needing migration.`);
    if (DRY_RUN) console.log("DRY RUN — no changes will be written.\n");

    let updated = 0;
    for (const p of staleProjects) {
        const oldFinal = p.finalScore;
        const newFinal = to9(oldFinal);

        const ev = p.evaluation || {};
        const newEv = {
            architectureScore: to9(ev.architectureScore),
            codeQualityScore: to9(ev.codeQualityScore),
            scalabilityScore: to9(ev.scalabilityScore),
            innovationScore: to9(ev.innovationScore),
            realWorldImpactScore: to9(ev.realWorldImpactScore),
            complexity: to9(ev.complexity),
            companyFit: {
                google: to9(ev.companyFit?.google),
                startup: to9(ev.companyFit?.startup),
                mnc: to9(ev.companyFit?.mnc),
            },
        };

        console.log(`  [${p._id}] "${p.title}"`);
        console.log(`    finalScore:          ${oldFinal} → ${newFinal}`);
        console.log(`    architecture:        ${ev.architectureScore} → ${newEv.architectureScore}`);
        console.log(`    codeQuality:         ${ev.codeQualityScore} → ${newEv.codeQualityScore}`);
        console.log(`    scalability:         ${ev.scalabilityScore} → ${newEv.scalabilityScore}`);
        console.log(`    innovation:          ${ev.innovationScore} → ${newEv.innovationScore}`);
        console.log(`    realWorldImpact:     ${ev.realWorldImpactScore} → ${newEv.realWorldImpactScore}`);
        console.log(`    complexity:          ${ev.complexity} → ${newEv.complexity}`);
        console.log(`    companyFit.google:   ${ev.companyFit?.google} → ${newEv.companyFit.google}`);
        console.log(`    companyFit.startup:  ${ev.companyFit?.startup} → ${newEv.companyFit.startup}`);
        console.log(`    companyFit.mnc:      ${ev.companyFit?.mnc} → ${newEv.companyFit.mnc}`);
        console.log();

        if (!DRY_RUN) {
            await Project.updateOne(
                { _id: p._id },
                {
                    $set: {
                        finalScore: newFinal,
                        "evaluation.architectureScore": newEv.architectureScore,
                        "evaluation.codeQualityScore": newEv.codeQualityScore,
                        "evaluation.scalabilityScore": newEv.scalabilityScore,
                        "evaluation.innovationScore": newEv.innovationScore,
                        "evaluation.realWorldImpactScore": newEv.realWorldImpactScore,
                        "evaluation.complexity": newEv.complexity,
                        "evaluation.companyFit.google": newEv.companyFit.google,
                        "evaluation.companyFit.startup": newEv.companyFit.startup,
                        "evaluation.companyFit.mnc": newEv.companyFit.mnc,
                    },
                }
            );
            updated++;
        }
    }

    if (DRY_RUN) {
        console.log(`Dry run complete. ${staleProjects.length} document(s) would be updated.`);
    } else {
        console.log(`Migration complete. ${updated}/${staleProjects.length} document(s) updated.`);
    }

    await mongoose.disconnect();
    process.exit(0);
}

run().catch((err) => {
    console.error("Migration failed:", err.message);
    process.exit(1);
});
