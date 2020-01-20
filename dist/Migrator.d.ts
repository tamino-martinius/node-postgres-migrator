import { ConnectionConfig } from './Connector';
import { Migration } from './types';
export declare class Migrator {
    tableName: string;
    config: ConnectionConfig | undefined;
    constructor(config?: ConnectionConfig & {
        tableName?: string;
    });
    private connect;
    createDatabase(): Promise<void>;
    dropDatabase(): Promise<void>;
    createTable(): Promise<void>;
    tableExists(): Promise<boolean>;
    dropTable(): Promise<void>;
    migrate(migrations: Migration[]): Promise<void>;
    up(migration: Migration): Promise<void>;
    down(migration: Migration): Promise<void>;
}
export default Migrator;
