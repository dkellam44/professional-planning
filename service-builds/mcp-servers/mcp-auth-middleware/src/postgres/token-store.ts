import { Pool } from 'pg';
import { TokenStoreInterface } from '../types/token-store';
import { encrypt, decrypt } from '../encryption';

export class TokenStore implements TokenStoreInterface {
  private pool: Pool;
  private encryptionKey: string;

  constructor(pool: Pool, encryptionKey: string) {
    if (!encryptionKey) {
      throw new Error('Encryption key is required for TokenStore');
    }
    this.pool = pool;
    this.encryptionKey = encryptionKey;
  }

  /**
   * Get or create service ID
   */
  private async getServiceId(serviceName: string): Promise<number> {
    const client = await this.pool.connect();
    
    try {
      // Try to get existing service
      const result = await client.query(
        'SELECT id FROM services WHERE name = $1',
        [serviceName]
      );

      if (result.rows.length > 0) {
        return result.rows[0].id;
      }

      // Create new service
      const insertResult = await client.query(
        'INSERT INTO services (name) VALUES ($1) RETURNING id',
        [serviceName]
      );

      return insertResult.rows[0].id;
    } finally {
      client.release();
    }
  }

  /**
   * Get token from database
   */
  public async getToken(serviceName: string, key: string): Promise<string | null> {
    const serviceId = await this.getServiceId(serviceName);
    const client = await this.pool.connect();

    try {
      const result = await client.query(
        'SELECT encrypted_value, iv, tag FROM tokens WHERE service_id = $1 AND key = $2',
        [serviceId, key]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      const encryptedData = {
        encrypted: row.encrypted_value,
        iv: row.iv,
        tag: row.tag
      };

      // Decrypt the token
      return decrypt(encryptedData, this.encryptionKey);
    } catch (error) {
      throw new Error(`Failed to get token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      client.release();
    }
  }

  /**
   * Store token in database
   */
  public async setToken(serviceName: string, key: string, value: string): Promise<void> {
    const serviceId = await this.getServiceId(serviceName);
    const client = await this.pool.connect();

    try {
      // Encrypt the token
      const encryptedData = encrypt(value, this.encryptionKey);

      // Insert or update the token
      await client.query(
        `INSERT INTO tokens (service_id, key, encrypted_value, iv, tag)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (service_id, key)
         DO UPDATE SET
           encrypted_value = EXCLUDED.encrypted_value,
           iv = EXCLUDED.iv,
           tag = EXCLUDED.tag,
           updated_at = CURRENT_TIMESTAMP`,
        [serviceId, key, encryptedData.encrypted, encryptedData.iv, encryptedData.tag]
      );

      // Log the action
      await this.auditLog(serviceName, 'SET_TOKEN');
    } catch (error) {
      throw new Error(`Failed to set token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      client.release();
    }
  }

  /**
   * Delete token from database
   */
  public async deleteToken(serviceName: string, key: string): Promise<void> {
    const serviceId = await this.getServiceId(serviceName);
    const client = await this.pool.connect();

    try {
      await client.query(
        'DELETE FROM tokens WHERE service_id = $1 AND key = $2',
        [serviceId, key]
      );

      // Log the action
      await this.auditLog(serviceName, 'DELETE_TOKEN');
    } catch (error) {
      throw new Error(`Failed to delete token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      client.release();
    }
  }

  /**
   * Rotate encryption key for all tokens in a service
   */
  public async rotateKey(oldKey: string, newKey: string): Promise<number> {
    if (oldKey === newKey) {
      throw new Error('Old and new keys must be different');
    }

    const client = await this.pool.connect();

    try {
      // Get all tokens for all services
      const result = await client.query(`
        SELECT t.id, t.service_id, t.key, t.encrypted_value, t.iv, t.tag, s.name as service_name
        FROM tokens t
        JOIN services s ON t.service_id = s.id
      `);

      let rotatedCount = 0;

      for (const row of result.rows) {
        try {
          // Decrypt with old key
          const oldEncryptedData = {
            encrypted: row.encrypted_value,
            iv: row.iv,
            tag: row.tag
          };
          const plaintext = decrypt(oldEncryptedData, oldKey);

          // Encrypt with new key
          const newEncryptedData = encrypt(plaintext, newKey);

          // Update the token
          await client.query(
            `UPDATE tokens
             SET encrypted_value = $1, iv = $2, tag = $3, updated_at = CURRENT_TIMESTAMP
             WHERE id = $4`,
            [newEncryptedData.encrypted, newEncryptedData.iv, newEncryptedData.tag, row.id]
          );

          rotatedCount++;
        } catch (error) {
          console.error(`Failed to rotate token ${row.id} for service ${row.service_name}:`, error);
        }
      }

      // Log the action
      await this.auditLog('all_services', 'ROTATE_KEY', undefined, { rotatedCount });

      return rotatedCount;
    } catch (error) {
      throw new Error(`Failed to rotate keys: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      client.release();
    }
  }

  /**
   * Log an action to the audit log
   */
  public async auditLog(
    serviceName: string,
    action: string,
    userEmail?: string,
    details?: Record<string, unknown>
  ): Promise<void> {
    const serviceId = await this.getServiceId(serviceName);
    const client = await this.pool.connect();

    try {
      await client.query(
        `INSERT INTO audit_log (service_id, action, user_email, details)
         VALUES ($1, $2, $3, $4)`,
        [serviceId, action, userEmail, details ? JSON.stringify(details) : null]
      );
    } catch (error) {
      // Don't throw on audit log failure, just log it
      console.error('Failed to write audit log:', error);
    } finally {
      client.release();
    }
  }

  /**
   * Get audit log entries for a service
   */
  public async getAuditLog(
    serviceName: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<Array<{
    id: number;
    action: string;
    user_email: string | null;
    details: Record<string, unknown> | null;
    timestamp: Date;
  }>> {
    const serviceId = await this.getServiceId(serviceName);
    const client = await this.pool.connect();

    try {
      const result = await client.query(
        `SELECT id, action, user_email, details, timestamp
         FROM audit_log
         WHERE service_id = $1
         ORDER BY timestamp DESC
         LIMIT $2 OFFSET $3`,
        [serviceId, limit, offset]
      );

      return result.rows.map(row => ({
        ...row,
        details: row.details ? JSON.parse(row.details) : null,
        timestamp: new Date(row.timestamp)
      }));
    } finally {
      client.release();
    }
  }
}