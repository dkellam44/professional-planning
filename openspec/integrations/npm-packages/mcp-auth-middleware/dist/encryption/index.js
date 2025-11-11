"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.encrypt = encrypt;
exports.decrypt = decrypt;
exports.encryptToString = encryptToString;
exports.decryptFromString = decryptFromString;
exports.generateEncryptionKey = generateEncryptionKey;
exports.validateEncryptionKey = validateEncryptionKey;
const crypto_1 = __importDefault(require("crypto"));
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // For AES, this is always 16
const KEY_LENGTH = 32; // For AES-256, this is always 32
const SALT = 'mcp-auth-middleware-salt'; // Fixed salt for reproducible key derivation
/**
 * Encrypt data using AES-256-GCM
 */
function encrypt(plaintext, key) {
    if (!key || key.length === 0) {
        throw new Error('Encryption key is required');
    }
    // Derive a 32-byte key from the provided key
    const derivedKey = crypto_1.default.scryptSync(key, SALT, KEY_LENGTH);
    // Generate a random IV
    const iv = crypto_1.default.randomBytes(IV_LENGTH);
    // Create cipher - use createCipheriv with the algorithm, key, and IV
    const cipher = crypto_1.default.createCipheriv(ALGORITHM, derivedKey, iv);
    // Encrypt the plaintext
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    // Get the authentication tag
    const tag = cipher.getAuthTag();
    return {
        encrypted,
        iv: iv.toString('hex'),
        tag: tag.toString('hex')
    };
}
/**
 * Decrypt data using AES-256-GCM
 */
function decrypt(encryptedData, key) {
    if (!key || key.length === 0) {
        throw new Error('Decryption key is required');
    }
    // Derive the same 32-byte key from the provided key
    const derivedKey = crypto_1.default.scryptSync(key, SALT, KEY_LENGTH);
    // Convert hex strings back to buffers
    const iv = Buffer.from(encryptedData.iv, 'hex');
    const tag = Buffer.from(encryptedData.tag, 'hex');
    // Create decipher - use createDecipheriv with the algorithm, key, and IV
    const decipher = crypto_1.default.createDecipheriv(ALGORITHM, derivedKey, iv);
    // Set the authentication tag
    decipher.setAuthTag(tag);
    // Decrypt the data
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}
/**
 * Encrypt data and return as a single string (IV:encrypted:tag)
 */
function encryptToString(plaintext, key) {
    const result = encrypt(plaintext, key);
    return `${result.iv}:${result.encrypted}:${result.tag}`;
}
/**
 * Decrypt data from a single string (IV:encrypted:tag)
 */
function decryptFromString(encryptedString, key) {
    const parts = encryptedString.split(':');
    if (parts.length !== 3) {
        throw new Error('Invalid encrypted string format');
    }
    const [iv, encrypted, tag] = parts;
    if (!iv || !encrypted || !tag) {
        throw new Error('Invalid encrypted string format');
    }
    return decrypt({ encrypted, iv, tag }, key);
}
/**
 * Generate a secure random encryption key
 */
function generateEncryptionKey() {
    return crypto_1.default.randomBytes(32).toString('hex');
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
//# sourceMappingURL=index.js.map