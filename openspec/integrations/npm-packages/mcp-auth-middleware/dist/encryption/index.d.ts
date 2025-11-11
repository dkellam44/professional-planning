export interface EncryptionResult {
    encrypted: string;
    iv: string;
    tag: string;
}
/**
 * Encrypt data using AES-256-GCM
 */
export declare function encrypt(plaintext: string, key: string): EncryptionResult;
/**
 * Decrypt data using AES-256-GCM
 */
export declare function decrypt(encryptedData: EncryptionResult, key: string): string;
/**
 * Encrypt data and return as a single string (IV:encrypted:tag)
 */
export declare function encryptToString(plaintext: string, key: string): string;
/**
 * Decrypt data from a single string (IV:encrypted:tag)
 */
export declare function decryptFromString(encryptedString: string, key: string): string;
/**
 * Generate a secure random encryption key
 */
export declare function generateEncryptionKey(): string;
/**
 * Validate encryption key strength
 */
export declare function validateEncryptionKey(key: string): boolean;
//# sourceMappingURL=index.d.ts.map