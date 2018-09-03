export abstract class Connector {
  constructor(public tableName: string) { }

  public abstract async tableExists(): Promise<boolean>;
  public abstract async createTable(): Promise<void>;
  public abstract async dropTable(): Promise<void>;
  public abstract async getMigrationKeys(): Promise<string[]>;
  public abstract async insertMigration(key: string): Promise<void>;
  public abstract async deleteMigrations(key: string): Promise<void>;
}

export default Connector;
