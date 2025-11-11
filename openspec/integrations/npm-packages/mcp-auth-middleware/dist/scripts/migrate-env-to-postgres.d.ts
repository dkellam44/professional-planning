#!/usr/bin/env node
interface MigrationConfig {
    serviceName: string;
    envVarName: string;
    postgresHost: string;
    postgresPort: number;
    postgresDatabase: string;
    postgresUser: string;
    postgresPassword: string;
    encryptionKey?: string;
    dryRun: boolean;
    dockerComposePath?: string;
}
/**
 * Main migration function
 */
declare function migrate(config: MigrationConfig): Promise<void>;
export { migrate };
export type { MigrationConfig };
//# sourceMappingURL=migrate-env-to-postgres.d.ts.map