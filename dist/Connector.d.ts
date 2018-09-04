export declare class Connector {
    tableName: string;
    private pool;
    constructor(tableName?: string);
    private readonly isTableNameValid;
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
    disconnect(): Promise<void>;
}
export default Connector;
