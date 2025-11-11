export interface BearerTokenConfig {
    token?: string | undefined;
    allowAnyToken?: boolean;
    maxTokenLength?: number;
}
/**
 * Validate Bearer token from Authorization header
 */
export declare function validateBearerToken(authHeader: string, config?: BearerTokenConfig): {
    valid: boolean;
    token?: string;
    userEmail?: string;
};
/**
 * Extract Bearer token from Authorization header
 */
export declare function extractBearerToken(authHeader: string): string | null;
//# sourceMappingURL=bearer-token.d.ts.map