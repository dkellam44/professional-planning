"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateBearerToken = validateBearerToken;
exports.extractBearerToken = extractBearerToken;
/**
 * Validate Bearer token from Authorization header
 */
function validateBearerToken(authHeader, config = {}) {
    if (!authHeader.startsWith('Bearer ')) {
        return { valid: false };
    }
    const token = authHeader.substring(7);
    // Validate token length
    const maxLength = config.maxTokenLength ?? 1000;
    if (token.length === 0 || token.length > maxLength) {
        return { valid: false };
    }
    // If specific token is configured, validate against it
    if (config.token) {
        return {
            valid: token === config.token,
            token,
            userEmail: 'authenticated@localhost'
        };
    }
    // If allowAnyToken is true, accept any valid-looking token
    if (config.allowAnyToken) {
        return {
            valid: true,
            token,
            userEmail: 'developer@localhost'
        };
    }
    // Default behavior: reject if no specific token or allowAnyToken configured
    return { valid: false };
}
/**
 * Extract Bearer token from Authorization header
 */
function extractBearerToken(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    return authHeader.substring(7);
}
//# sourceMappingURL=bearer-token.js.map