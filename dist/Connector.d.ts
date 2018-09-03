export declare abstract class Connector {
    tableName: string;
    constructor(tableName: string);
    abstract tableExists(): Promise<boolean>;
    abstract createTable(): Promise<void>;
    abstract dropTable(): Promise<void>;
    abstract getMigrationKeys(): Promise<string[]>;
    abstract insertMigration(key: string): Promise<void>;
    abstract deleteMigrations(key: string): Promise<void>;
}
export default Connector;
