"use strict";
/**
 * In-memory storage for OAuth authorization codes
 *
 * Stores temporary codes that map to Coda API tokens
 * Codes expire after 5 minutes
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.authStore = void 0;
const crypto_1 = require("crypto");
class AuthStore {
    store = new Map();
    CODE_TTL = 5 * 60 * 1000; // 5 minutes
    constructor() {
        // Cleanup expired codes every minute
        setInterval(() => this.cleanup(), 60 * 1000);
    }
    /**
     * Generate and store a new authorization code
     */
    createCode(codaToken, codeChallenge, codeChallengeMethod) {
        const code = (0, crypto_1.randomBytes)(32).toString('base64url');
        this.store.set(code, {
            codaToken,
            codeChallenge,
            codeChallengeMethod,
            timestamp: Date.now(),
            used: false
        });
        console.log(`[AuthStore] Created code: ${code.substring(0, 8)}... (PKCE: ${codeChallenge ? 'enabled' : 'disabled'})`);
        return code;
    }
    /**
     * Exchange code for token (one-time use)
     */
    exchangeCode(code, codeVerifier) {
        const data = this.store.get(code);
        if (!data) {
            console.log(`[AuthStore] Code not found: ${code.substring(0, 8)}...`);
            return null;
        }
        if (data.used) {
            console.log(`[AuthStore] Code already used: ${code.substring(0, 8)}...`);
            this.store.delete(code); // Remove used code
            return null;
        }
        // Check expiration
        if (Date.now() - data.timestamp > this.CODE_TTL) {
            console.log(`[AuthStore] Code expired: ${code.substring(0, 8)}...`);
            this.store.delete(code);
            return null;
        }
        // Verify PKCE code_verifier if code_challenge was provided
        if (data.codeChallenge) {
            if (!codeVerifier) {
                console.log(`[AuthStore] PKCE required but no code_verifier provided: ${code.substring(0, 8)}...`);
                return null;
            }
            // Validate code_verifier against code_challenge
            const method = data.codeChallengeMethod || 'plain';
            let computedChallenge;
            if (method === 'S256') {
                // Hash the code_verifier with SHA256 and base64url encode
                computedChallenge = (0, crypto_1.createHash)('sha256')
                    .update(codeVerifier)
                    .digest('base64url');
            }
            else {
                // Plain method: direct comparison
                computedChallenge = codeVerifier;
            }
            if (computedChallenge !== data.codeChallenge) {
                console.log(`[AuthStore] PKCE validation failed (${method}): ${code.substring(0, 8)}...`);
                return null;
            }
            console.log(`[AuthStore] PKCE validation passed (${method})`);
        }
        // Mark as used and return token
        data.used = true;
        console.log(`[AuthStore] Code exchanged: ${code.substring(0, 8)}...`);
        // Delete immediately after use
        this.store.delete(code);
        return data.codaToken;
    }
    /**
     * Cleanup expired codes
     */
    cleanup() {
        const now = Date.now();
        let removed = 0;
        for (const [code, data] of this.store.entries()) {
            if (now - data.timestamp > this.CODE_TTL || data.used) {
                this.store.delete(code);
                removed++;
            }
        }
        if (removed > 0) {
            console.log(`[AuthStore] Cleaned up ${removed} expired codes`);
        }
    }
    /**
     * Get store stats (for debugging)
     */
    getStats() {
        const now = Date.now();
        let expired = 0;
        for (const data of this.store.values()) {
            if (now - data.timestamp > this.CODE_TTL) {
                expired++;
            }
        }
        return { total: this.store.size, expired };
    }
}
// Singleton instance
exports.authStore = new AuthStore();
