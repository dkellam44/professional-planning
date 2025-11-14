export interface BearerTokenConfig {
  token?: string | undefined;
  allowAnyToken?: boolean;
  maxTokenLength?: number;
}

/**
 * Validate Bearer token from Authorization header
 */
export function validateBearerToken(
  authHeader: string,
  config: BearerTokenConfig = {}
): { valid: boolean; token?: string; userEmail?: string } {
  if (!authHeader.startsWith('Bearer ')) {
    return { valid: false };
  }

  const token = authHeader.substring(7);
  
  // Validate token length
  const maxLength = config.maxTokenLength ?? 1000;
  if (token.length === 0 || token.length > maxLength) {
    return { valid: false };
  }

  // If specific token is configured, validate against it
  if (config.token) {
    return {
      valid: token === config.token,
      token,
      userEmail: 'authenticated@localhost'
    };
  }

  // If allowAnyToken is true, accept any valid-looking token
  if (config.allowAnyToken) {
    return {
      valid: true,
      token,
      userEmail: 'developer@localhost'
    };
  }

  // Default behavior: reject if no specific token or allowAnyToken configured
  return { valid: false };
}

/**
 * Extract Bearer token from Authorization header
 */
export function extractBearerToken(authHeader: string): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}