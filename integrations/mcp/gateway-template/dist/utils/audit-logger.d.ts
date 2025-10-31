/**
 * Audit Logger
 *
 * Logs all authentication events and errors for security monitoring
 */
export declare class AuditLogger {
    private service;
    constructor(service: string);
    /**
     * Log an authentication or security event
     */
    log(eventType: string, status: string, details?: Record<string, any>): void;
    private getStatus;
}
//# sourceMappingURL=audit-logger.d.ts.map