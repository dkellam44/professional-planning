"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloudflareAccessValidator = void 0;
exports.validateCloudflareAccessJWT = validateCloudflareAccessJWT;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const jwks_rsa_1 = __importDefault(require("jwks-rsa"));
/**
 * Cloudflare Access JWT validator
 */
class CloudflareAccessValidator {
    constructor(config) {
        this.config = config;
        this.jwksClient = (0, jwks_rsa_1.default)({
            jwksUri: `https://${config.teamDomain}/cdn-cgi/access/certs`,
            cache: config.cache ?? true,
            cacheMaxEntries: config.cacheMaxEntries ?? 5,
            cacheMaxAge: config.cacheMaxAge ?? 60 * 60 * 1000, // 1 hour
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
                audience: this.config.audience,
                issuer: `https://${this.config.teamDomain}`,
                algorithms: ['RS256'],
            }, (err, decoded) => {
                if (err) {
                    reject(new Error(`JWT validation failed: ${err.message}`));
                }
                else if (decoded && typeof decoded === 'object') {
                    const email = decoded['email'];
                    const user_uuid = decoded['user_uuid'];
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
}
exports.CloudflareAccessValidator = CloudflareAccessValidator;
/**
 * Standalone function to validate Cloudflare Access JWT
 */
async function validateCloudflareAccessJWT(token, teamDomain, audience) {
    const validator = new CloudflareAccessValidator({ teamDomain, audience });
    return validator.validateJWT(token);
}
//# sourceMappingURL=cloudflare-access.js.map