"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateEncryptionKey = generateEncryptionKey;
exports.generateApiToken = generateApiToken;
exports.validateEncryptionKey = validateEncryptionKey;
exports.deriveKey = deriveKey;
const crypto_1 = __importDefault(require("crypto"));
/**
 * Generate a secure random encryption key
 */
function generateEncryptionKey() {
    return crypto_1.default.randomBytes(32).toString('hex');
}
/**
 * Generate a secure random API token
 */
function generateApiToken(prefix = 'pat_') {
    const randomPart = crypto_1.default.randomBytes(32).toString('hex');
    return `${prefix}${randomPart}`;
}
/**
 * Validate encryption key strength
 */
function validateEncryptionKey(key) {
    if (!key || key.length < 16) {
        return false;
    }
    // Check for sufficient entropy (simple heuristic)
    const uniqueChars = new Set(key).size;
    return uniqueChars >= Math.min(key.length * 0.3, 10);
}
/**
 * Derive encryption key from password and salt
 */
function deriveKey(password, salt) {
    return crypto_1.default.scryptSync(password, salt, 32).toString('hex');
}
//# sourceMappingURL=key-generation.js.map