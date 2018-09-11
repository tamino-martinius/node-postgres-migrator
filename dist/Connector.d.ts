import { Pool, PoolConfig } from 'pg';
import { Migration } from './types';
export declare class Connector {
    tableName: string;
    pool: Pool;
    constructor(tableName?: string, poolConfig?: PoolConfig);
    private readonly isTableNameValid;
    createDatabase(): Promise<void>;
    dropDatabase(): Promise<void>;
    tableExists(): Promise<boolean>;
    private createIndex;
    createTable(): Promise<void>;
    private dropIndex;
    dropTable(): Promise<void>;
    getMigrationKeys(): Promise<string[]>;
    insertMigrationKey(key: string): Promise<void>;
    deleteMigrationKey(key: string): Promise<void>;
    beginTransaction(): Promise<void>;
    endTransaction(): Promise<void>;
    rollbackTransaction(): Promise<void>;
    up(migration: Migration): Promise<void>;
    down(migration: Migration): Promise<void>;
    disconnect(): Promise<void>;
}
export default Connector;
