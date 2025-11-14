import { validateBearerToken, extractBearerToken } from '../bearer-token';

describe('Bearer Token Validator', () => {
  describe('validateBearerToken', () => {
    it('should validate correct bearer token', () => {
      const result = validateBearerToken('Bearer test-token-123', {
        token: 'test-token-123'
      });
      
      expect(result.valid).toBe(true);
      expect(result.token).toBe('test-token-123');
      expect(result.userEmail).toBe('authenticated@localhost');
    });

    it('should reject incorrect bearer token', () => {
      const result = validateBearerToken('Bearer wrong-token', {
        token: 'correct-token'
      });
      
      expect(result.valid).toBe(false);
      expect(result.token).toBe('wrong-token');
      expect(result.userEmail).toBe('authenticated@localhost');
    });

    it('should allow any token when allowAnyToken is true', () => {
      const result = validateBearerToken('Bearer any-token-123', {
        allowAnyToken: true
      });
      
      expect(result.valid).toBe(true);
      expect(result.token).toBe('any-token-123');
      expect(result.userEmail).toBe('developer@localhost');
    });

    it('should reject non-bearer authorization header', () => {
      const result = validateBearerToken('Basic dXNlcjpwYXNz', {
        token: 'test-token'
      });
      
      expect(result.valid).toBe(false);
    });

    it('should reject empty bearer token', () => {
      const result = validateBearerToken('Bearer ', {
        token: 'test-token'
      });
      
      expect(result.valid).toBe(false);
    });

    it('should reject token that is too long', () => {
      const longToken = 'a'.repeat(1001);
      const result = validateBearerToken(`Bearer ${longToken}`, {
        maxTokenLength: 1000
      });
      
      expect(result.valid).toBe(false);
    });

    it('should accept token at maximum length', () => {
      const maxToken = 'a'.repeat(1000);
      const result = validateBearerToken(`Bearer ${maxToken}`, {
        allowAnyToken: true,
        maxTokenLength: 1000
      });
      
      expect(result.valid).toBe(true);
      expect(result.token).toBe(maxToken);
    });

    it('should reject token without allowAnyToken and no specific token', () => {
      const result = validateBearerToken('Bearer some-token');
      
      expect(result.valid).toBe(false);
    });

    it('should handle missing authorization header gracefully', () => {
      const result = validateBearerToken('', {
        token: 'test-token'
      });
      
      expect(result.valid).toBe(false);
    });
  });

  describe('extractBearerToken', () => {
    it('should extract token from valid bearer header', () => {
      const token = extractBearerToken('Bearer test-token-123');
      expect(token).toBe('test-token-123');
    });

    it('should return null for non-bearer header', () => {
      const token = extractBearerToken('Basic dXNlcjpwYXNz');
      expect(token).toBeNull();
    });

    it('should return null for empty header', () => {
      const token = extractBearerToken('');
      expect(token).toBeNull();
    });

    it('should return null for bearer without token', () => {
      const token = extractBearerToken('Bearer ');
      expect(token).toBe('');
    });

    it('should handle case sensitivity', () => {
      const token = extractBearerToken('bearer test-token-123');
      expect(token).toBeNull();
    });
  });
});