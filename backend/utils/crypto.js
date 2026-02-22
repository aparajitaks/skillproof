const crypto = require("crypto");

const CERT_SECRET = process.env.CERT_SECRET || "changeme-please-set-CERT_SECRET-in-env";

/**
 * Generate an HMAC-SHA256 signature for a certificate.
 * Used to tamper-proof the certificate at issuance.
 *
 * @param {string} certificationId  e.g. "SP-A1B2C3D4"
 * @param {string} projectId        MongoDB ObjectId string
 * @param {string} userId           MongoDB ObjectId string
 * @returns {string} hex digest
 */
function signCertificate(certificationId, projectId, userId) {
    return crypto
        .createHmac("sha256", CERT_SECRET)
        .update(`${certificationId}:${projectId}:${userId}`)
        .digest("hex");
}

/**
 * Verify a certificate's HMAC signature.
 *
 * @returns {boolean}
 */
function verifyCertificateSignature(certificationId, projectId, userId, signature) {
    const expected = signCertificate(certificationId, projectId, userId);
    // Constant-time comparison to prevent timing attacks
    try {
        return crypto.timingSafeEqual(
            Buffer.from(expected, "hex"),
            Buffer.from(signature, "hex")
        );
    } catch {
        return false;
    }
}

module.exports = { signCertificate, verifyCertificateSignature };
