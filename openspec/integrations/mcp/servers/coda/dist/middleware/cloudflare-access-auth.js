"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = exports.cloudflareAccessAuth = exports.CloudflareAccessAuth = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const jwks_rsa_1 = __importDefault(require("jwks-rsa"));
const config_1 = require("../config");
// Cloudflare Access JWT validation
class CloudflareAccessAuth {
    constructor() {
        this.jwksClient = (0, jwks_rsa_1.default)({
            jwksUri: `https://${config_1.config.cloudflareAccessTeamDomain}/cdn-cgi/access/certs`,
            cache: true,
            cacheMaxEntries: 5,
            cacheMaxAge: 60 * 60 * 1000, // 1 hour
        });
    }
    /**
     * Get signing key for JWT verification
     */
    getKey(header, callback) {
        this.jwksClient.getSigningKey(header.kid, (err, key) => {
            if (err) {
                callback(err);
            }
            else if (key) {
                const signingKey = key.getPublicKey();
                callback(null, signingKey);
            }
            else {
                callback(new Error('No signing key found'));
            }
        });
    }
    /**
     * Validate Cloudflare Access JWT
     */
    async validateJWT(token) {
        return new Promise((resolve, reject) => {
            jsonwebtoken_1.default.verify(token, this.getKey.bind(this), {
                audience: config_1.config.cloudflareAccessAud,
                issuer: `https://${config_1.config.cloudflareAccessTeamDomain}`,
                algorithms: ['RS256'],
            }, (err, decoded) => {
                if (err) {
                    reject(new Error(`JWT validation failed: ${err.message}`));
                }
                else if (decoded && typeof decoded === 'object') {
                    const email = decoded.email;
                    const user_uuid = decoded.user_uuid;
                    if (!email) {
                        reject(new Error('JWT missing email claim'));
                    }
                    else {
                        resolve({ email, user_uuid });
                    }
                }
                else {
                    reject(new Error('Invalid JWT payload'));
                }
            });
        });
    }
    /**
     * Validate Bearer token (for development/local testing)
     */
    validateBearerToken(authHeader) {
        if (!authHeader.startsWith('Bearer ')) {
            return false;
        }
        const token = authHeader.substring(7);
        // In development mode, accept any non-empty token
        // In production, this should validate against a known token
        if (config_1.config.authMode === 'bearer' && config_1.config.bearerToken) {
            return token === config_1.config.bearerToken;
        }
        // For 'both' mode, accept any valid-looking token in development
        return token.length > 0 && token.length < 1000;
    }
    /**
     * Express middleware for authentication
     */
    middleware() {
        return async (req, res, next) => {
            try {
                // Skip authentication for health and status endpoints
                if (req.path === '/health' || req.path === '/status') {
                    // Add auth status to health check
                    if (req.path === '/health') {
                        req.serviceToken = 'health-check';
                    }
                    return next();
                }
                let authenticated = false;
                let userEmail;
                let userUuid;
                // Check for Cloudflare Access JWT
                const cfAccessJWT = req.headers['cf-access-jwt-assertion'];
                if (cfAccessJWT && (config_1.config.authMode === 'cloudflare' || config_1.config.authMode === 'both')) {
                    try {
                        const userInfo = await this.validateJWT(cfAccessJWT);
                        authenticated = true;
                        userEmail = userInfo.email;
                        userUuid = userInfo.user_uuid;
                        if (config_1.config.logLevel === 'debug') {
                            console.log(`[DEBUG] Cloudflare Access JWT validated for: ${userEmail}`);
                        }
                    }
                    catch (error) {
                        console.log(`[WARN] Cloudflare Access JWT validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    }
                }
                // Check for Bearer token (fallback for development)
                const authHeader = req.headers.authorization;
                if (!authenticated && authHeader && (config_1.config.authMode === 'bearer' || config_1.config.authMode === 'both')) {
                    if (this.validateBearerToken(authHeader)) {
                        authenticated = true;
                        userEmail = 'developer@localhost';
                        userUuid = 'dev-user-uuid';
                        if (config_1.config.logLevel === 'debug') {
                            console.log(`[DEBUG] Bearer token authenticated for: ${userEmail}`);
                        }
                    }
                }
                if (!authenticated) {
                    res.status(401).json({
                        error: 'Authentication required',
                        message: 'Valid Cloudflare Access JWT or Bearer token required',
                        timestamp: new Date().toISOString()
                    });
                    return;
                }
                // Set user info on request
                if (userEmail && userUuid) {
                    req.user = { email: userEmail, user_uuid: userUuid };
                }
                // Set service token for Coda API calls
                req.serviceToken = config_1.config.codaApiToken;
                next();
            }
            catch (error) {
                console.error('[ERROR] Authentication middleware error:', error);
                res.status(500).json({
                    error: 'Internal server error',
                    message: 'Authentication system error',
                    timestamp: new Date().toISOString()
                });
            }
        };
    }
}
exports.CloudflareAccessAuth = CloudflareAccessAuth;
// Export singleton instance
exports.cloudflareAccessAuth = new CloudflareAccessAuth();
// Export middleware function
exports.authenticate = exports.cloudflareAccessAuth.middleware();
//# sourceMappingURL=cloudflare-access-auth.js.map