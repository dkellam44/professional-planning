export interface CloudflareAccessConfig {
    teamDomain: string;
    audience: string;
    cache?: boolean;
    cacheMaxEntries?: number;
    cacheMaxAge?: number;
}
export interface CloudflareAccessUser {
    email: string;
    user_uuid: string;
}
/**
 * Cloudflare Access JWT validator
 */
export declare class CloudflareAccessValidator {
    private jwksClient;
    private config;
    constructor(config: CloudflareAccessConfig);
    /**
     * Get signing key for JWT verification
     */
    private getKey;
    /**
     * Validate Cloudflare Access JWT
     */
    validateJWT(token: string): Promise<CloudflareAccessUser>;
}
/**
 * Standalone function to validate Cloudflare Access JWT
 */
export declare function validateCloudflareAccessJWT(token: string, teamDomain: string, audience: string): Promise<CloudflareAccessUser>;
//# sourceMappingURL=cloudflare-access.d.ts.map