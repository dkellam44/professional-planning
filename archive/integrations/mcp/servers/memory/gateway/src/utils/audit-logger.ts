/**
 * Audit Logger
 *
 * Logs all authentication events and errors for security monitoring
 */

interface AuditLog {
  timestamp: string;
  service: string;
  event_type: string;
  status: 'success' | 'failure' | 'error' | 'warning';
  details: Record<string, any>;
}

export class AuditLogger {
  private service: string;

  constructor(service: string) {
    this.service = service;
  }

  /**
   * Log an authentication or security event
   */
  log(
    eventType: string,
    status: string,
    details: Record<string, any> = {}
  ): void {
    const logEntry: AuditLog = {
      timestamp: new Date().toISOString(),
      service: this.service,
      event_type: eventType,
      status: this.getStatus(status),
      details: {
        ...details,
        // Don't log sensitive data
        ...(details.token ? { token: '***REDACTED***' } : {}),
        ...(details.password ? { password: '***REDACTED***' } : {})
      }
    };

    // Log format depends on environment
    if (process.env.NODE_ENV === 'production') {
      // Production: JSON format for log aggregation
      console.log(JSON.stringify(logEntry));
    } else {
      // Development: human-readable format
      console.log(
        `[${logEntry.timestamp}] [${logEntry.service}] [${logEntry.event_type}] ` +
        `${JSON.stringify(logEntry.details)}`
      );
    }

    // Could send to external audit system (Sentry, DataDog, etc.)
    // this.sendToExternalAudit(logEntry);
  }

  private getStatus(status: string): 'success' | 'failure' | 'error' | 'warning' {
    const upper = status.toUpperCase();
    if (upper.includes('SUCCESS') || upper.includes('INITIALIZED') || upper.includes('VALIDATED')) {
      return 'success';
    }
    if (upper.includes('FAILURE') || upper.includes('INVALID') || upper.includes('DENIED')) {
      return 'failure';
    }
    if (upper.includes('ERROR') || upper.includes('FAILED')) {
      return 'error';
    }
    return 'warning';
  }
}
