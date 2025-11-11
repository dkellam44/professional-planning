import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // For AES, this is always 16
const KEY_LENGTH = 32; // For AES-256, this is always 32
const SALT = 'mcp-auth-middleware-salt'; // Fixed salt for reproducible key derivation

export interface EncryptionResult {
  encrypted: string;
  iv: string;
  tag: string;
}

/**
 * Encrypt data using AES-256-GCM
 */
export function encrypt(plaintext: string, key: string): EncryptionResult {
  if (!key || key.length === 0) {
    throw new Error('Encryption key is required');
  }

  // Derive a 32-byte key from the provided key
  const derivedKey = crypto.scryptSync(key, SALT, KEY_LENGTH);
  
  // Generate a random IV
  const iv = crypto.randomBytes(IV_LENGTH);
  
  // Create cipher - use createCipheriv with the algorithm, key, and IV
  const cipher = crypto.createCipheriv(ALGORITHM, derivedKey, iv);
  
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
export function decrypt(encryptedData: EncryptionResult, key: string): string {
  if (!key || key.length === 0) {
    throw new Error('Decryption key is required');
  }

  // Derive the same 32-byte key from the provided key
  const derivedKey = crypto.scryptSync(key, SALT, KEY_LENGTH);
  
  // Convert hex strings back to buffers
  const iv = Buffer.from(encryptedData.iv, 'hex');
  const tag = Buffer.from(encryptedData.tag, 'hex');
  
  // Create decipher - use createDecipheriv with the algorithm, key, and IV
  const decipher = crypto.createDecipheriv(ALGORITHM, derivedKey, iv);
  
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
export function encryptToString(plaintext: string, key: string): string {
  const result = encrypt(plaintext, key);
  return `${result.iv}:${result.encrypted}:${result.tag}`;
}

/**
 * Decrypt data from a single string (IV:encrypted:tag)
 */
export function decryptFromString(encryptedString: string, key: string): string {
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
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex');
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