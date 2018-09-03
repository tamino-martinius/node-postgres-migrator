import { Connector as AbstractConnector } from '@nextcode/migrator';
import { Pool } from 'pg';

export class Connector extends AbstractConnector {
  private pool: Pool;

  constructor(public tableName: string) {
    super(tableName);
    this.pool = new Pool();
  }

  public async tableExists(): Promise<boolean> {
    const result = await this.pool.query(
      `
        SELECT * FROM "information_schema"."tables"
        WHERE "table_schema" = current_schema()
          AND "table_name" = $1'
      `,
      [this.tableName],
    );
    return result.rowCount > 0;
  }

  public async createTable(): Promise<void> {

  }

  public async dropTable(): Promise<void> {

  }

  public async getMigrationKeys(): Promise<string[]> {

  }

  public async insertMigration(key: string): Promise<void> {

  }

  public async deleteMigrations(key: string): Promise<void> {

  }

}

export default Connector;
