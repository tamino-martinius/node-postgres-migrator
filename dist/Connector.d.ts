import { Connector as AbstractConnector } from '@nextcode/migrator';
export declare class Connector extends AbstractConnector {
    tableName: string;
    private pool;
    constructor(tableName?: string);
    private readonly isTableNameValid;
    tableExists(): Promise<boolean>;
    createTable(): Promise<void>;
    dropTable(): Promise<void>;
    getMigrationKeys(): Promise<string[]>;
    insertMigration(key: string): Promise<void>;
    deleteMigrations(key: string): Promise<void>;
}
export default Connector;
