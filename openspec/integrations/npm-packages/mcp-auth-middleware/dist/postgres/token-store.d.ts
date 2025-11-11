import { Pool } from 'pg';
import { TokenStoreInterface } from '../types/token-store';
export declare class TokenStore implements TokenStoreInterface {
    private pool;
    private encryptionKey;
    constructor(pool: Pool, encryptionKey: string);
    /**
     * Get or create service ID
     */
    private getServiceId;
    /**
     * Get token from database
     */
    getToken(serviceName: string, key: string): Promise<string | null>;
    /**
     * Store token in database
     */
    setToken(serviceName: string, key: string, value: string): Promise<void>;
    /**
     * Delete token from database
     */
    deleteToken(serviceName: string, key: string): Promise<void>;
    /**
     * Rotate encryption key for all tokens in a service
     */
    rotateKey(oldKey: string, newKey: string): Promise<number>;
    /**
     * Log an action to the audit log
     */
    auditLog(serviceName: string, action: string, userEmail?: string, details?: Record<string, unknown>): Promise<void>;
    /**
     * Get audit log entries for a service
     */
    getAuditLog(serviceName: string, limit?: number, offset?: number): Promise<Array<{
        id: number;
        action: string;
        user_email: string | null;
        details: Record<string, unknown> | null;
        timestamp: Date;
    }>>;
}
//# sourceMappingURL=token-store.d.ts.map