import { encrypt, decrypt, encryptToString, decryptFromString, generateEncryptionKey, validateEncryptionKey } from '../index';

describe('Encryption', () => {
  const testKey = 'test-encryption-key-32-bytes-long';
  const testData = 'This is a secret message that needs to be encrypted';

  describe('encrypt and decrypt', () => {
    it('should encrypt and decrypt data correctly', () => {
      const encrypted = encrypt(testData, testKey);
      
      expect(encrypted).toHaveProperty('encrypted');
      expect(encrypted).toHaveProperty('iv');
      expect(encrypted).toHaveProperty('tag');
      expect(encrypted.encrypted).not.toBe(testData);
      
      const decrypted = decrypt(encrypted, testKey);
      expect(decrypted).toBe(testData);
    });

    it('should produce different encrypted output for same input', () => {
      const encrypted1 = encrypt(testData, testKey);
      const encrypted2 = encrypt(testData, testKey);
      
      expect(encrypted1.encrypted).not.toBe(encrypted2.encrypted);
      expect(encrypted1.iv).not.toBe(encrypted2.iv);
      expect(encrypted1.tag).not.toBe(encrypted2.tag);
    });

    it('should fail with wrong key', () => {
      const encrypted = encrypt(testData, testKey);
      const wrongKey = 'wrong-encryption-key-32-bytes-long';
      
      expect(() => decrypt(encrypted, wrongKey)).toThrow();
    });

    it('should handle empty string', () => {
      const encrypted = encrypt('', testKey);
      const decrypted = decrypt(encrypted, testKey);
      expect(decrypted).toBe('');
    });

    it('should handle large data', () => {
      const largeData = 'x'.repeat(10000);
      const encrypted = encrypt(largeData, testKey);
      const decrypted = decrypt(encrypted, testKey);
      expect(decrypted).toBe(largeData);
    });
  });

  describe('encryptToString and decryptFromString', () => {
    it('should encrypt to string and decrypt from string', () => {
      const encryptedString = encryptToString(testData, testKey);
      
      expect(typeof encryptedString).toBe('string');
      expect(encryptedString.split(':')).toHaveLength(3);
      
      const decrypted = decryptFromString(encryptedString, testKey);
      expect(decrypted).toBe(testData);
    });

    it('should fail with invalid format', () => {
      expect(() => decryptFromString('invalid-format', testKey)).toThrow('Invalid encrypted string format');
    });

    it('should fail with missing parts', () => {
      expect(() => decryptFromString('part1:part2', testKey)).toThrow('Invalid encrypted string format');
    });
  });

  describe('generateEncryptionKey', () => {
    it('should generate a valid encryption key', () => {
      const key = generateEncryptionKey();
      
      expect(typeof key).toBe('string');
      expect(key.length).toBe(64); // 32 bytes in hex = 64 characters
      expect(() => Buffer.from(key, 'hex')).not.toThrow();
    });

    it('should generate different keys each time', () => {
      const key1 = generateEncryptionKey();
      const key2 = generateEncryptionKey();
      
      expect(key1).not.toBe(key2);
    });
  });

  describe('validateEncryptionKey', () => {
    it('should validate strong keys', () => {
      const strongKey = 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6';
      expect(validateEncryptionKey(strongKey)).toBe(true);
    });

    it('should reject short keys', () => {
      const shortKey = 'short';
      expect(validateEncryptionKey(shortKey)).toBe(false);
    });

    it('should reject keys with low entropy', () => {
      const lowEntropyKey = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
      expect(validateEncryptionKey(lowEntropyKey)).toBe(false);
    });

    it('should reject empty keys', () => {
      expect(validateEncryptionKey('')).toBe(false);
      expect(validateEncryptionKey(null as any)).toBe(false);
      expect(validateEncryptionKey(undefined as any)).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should throw on empty encryption key', () => {
      expect(() => encrypt(testData, '')).toThrow('Encryption key is required');
    });

    it('should throw on empty decryption key', () => {
      const encrypted = encrypt(testData, testKey);
      expect(() => decrypt(encrypted, '')).toThrow('Decryption key is required');
    });

    it('should throw on invalid encrypted data', () => {
      const invalidData = {
        encrypted: 'invalid',
        iv: 'invalid',
        tag: 'invalid'
      };
      
      expect(() => decrypt(invalidData, testKey)).toThrow();
    });
  });
});