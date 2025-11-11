import crypto from 'crypto';

/**
 * Generate a secure random encryption key
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate a secure random API token
 */
export function generateApiToken(prefix: string = 'pat_'): string {
  const randomPart = crypto.randomBytes(32).toString('hex');
  return `${prefix}${randomPart}`;
}

/**
 * Validate encryption key strength
 */
export function validateEncryptionKey(key: string): boolean {
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
export function deriveKey(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 32).toString('hex');
}