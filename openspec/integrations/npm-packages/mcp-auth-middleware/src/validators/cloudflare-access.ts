import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

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
export class CloudflareAccessValidator {
  private jwksClient: jwksClient.JwksClient;
  private config: CloudflareAccessConfig;

  constructor(config: CloudflareAccessConfig) {
    this.config = config;
    this.jwksClient = jwksClient({
      jwksUri: `https://${config.teamDomain}/cdn-cgi/access/certs`,
      cache: config.cache ?? true,
      cacheMaxEntries: config.cacheMaxEntries ?? 5,
      cacheMaxAge: config.cacheMaxAge ?? 60 * 60 * 1000, // 1 hour
    });
  }

  /**
   * Get signing key for JWT verification
   */
  private getKey(header: jwt.JwtHeader, callback: jwt.SigningKeyCallback): void {
    this.jwksClient.getSigningKey(header.kid, (err, key) => {
      if (err) {
        callback(err);
      } else if (key) {
        const signingKey = key.getPublicKey();
        callback(null, signingKey);
      } else {
        callback(new Error('No signing key found'));
      }
    });
  }

  /**
   * Validate Cloudflare Access JWT
   */
  public async validateJWT(token: string): Promise<CloudflareAccessUser> {
    return new Promise((resolve, reject) => {
      jwt.verify(
        token,
        this.getKey.bind(this),
        {
          audience: this.config.audience,
          issuer: `https://${this.config.teamDomain}`,
          algorithms: ['RS256'],
        },
        (err, decoded) => {
          if (err) {
            reject(new Error(`JWT validation failed: ${err.message}`));
          } else if (decoded && typeof decoded === 'object') {
            const email = decoded['email'] as string;
            const user_uuid = decoded['user_uuid'] as string;
            
            if (!email) {
              reject(new Error('JWT missing email claim'));
            } else {
              resolve({ email, user_uuid });
            }
          } else {
            reject(new Error('Invalid JWT payload'));
          }
        }
      );
    });
  }
}

/**
 * Standalone function to validate Cloudflare Access JWT
 */
export async function validateCloudflareAccessJWT(
  token: string,
  teamDomain: string,
  audience: string
): Promise<CloudflareAccessUser> {
  const validator = new CloudflareAccessValidator({ teamDomain, audience });
  return validator.validateJWT(token);
}