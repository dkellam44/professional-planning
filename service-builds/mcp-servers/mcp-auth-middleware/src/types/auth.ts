export type AuthMode = 'cloudflare' | 'bearer' | 'both';
export type TokenStoreType = 'env' | 'postgres';

export interface AuthConfig {
  mode: AuthMode;
  tokenStore: TokenStoreType;
  serviceName: string;
  encryptionKey?: string;
  cloudflareAccessTeamDomain?: string;
  cloudflareAccessAud?: string;
  bearerToken?: string;
  postgres?: {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
    ssl?: boolean;
    maxConnections?: number;
  };
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  skipAuthPaths?: string[];
}