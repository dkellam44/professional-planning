export interface Config {
    port: number;
    host: string;
    codaApiToken: string;
    codaApiBaseUrl: string;
    cloudflareAccessTeamDomain: string;
    cloudflareAccessAud: string;
    authMode: 'cloudflare' | 'bearer' | 'both';
    bearerToken?: string;
    postgres?: {
        host: string;
        port: number;
        database: string;
        user: string;
        password: string;
        maxConnections?: number;
    };
    encryptionKey?: string;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
}
export declare const config: Config;
export declare function validateConfig(): void;
export default config;
//# sourceMappingURL=config.d.ts.map