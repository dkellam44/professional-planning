/**
 * Generate a secure random encryption key
 */
export declare function generateEncryptionKey(): string;
/**
 * Generate a secure random API token
 */
export declare function generateApiToken(prefix?: string): string;
/**
 * Validate encryption key strength
 */
export declare function validateEncryptionKey(key: string): boolean;
/**
 * Derive encryption key from password and salt
 */
export declare function deriveKey(password: string, salt: string): string;
//# sourceMappingURL=key-generation.d.ts.map