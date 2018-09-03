import { Connector as AbstractConnector } from '@nextcode/migrator';
import { Pool } from 'pg';

export class Connector extends AbstractConnector {
  private pool: Pool;

  constructor(public tableName: string = 'migrations') {
    super(tableName);
    this.pool = new Pool();
    if (!this.isTableNameValid) throw `Invalid table name «${this.tableName}»`;
  }

  private get isTableNameValid() {
    return /[a-z]([a-z0-9_])*/.test(this.tableName);
  }

  public async tableExists(): Promise<boolean> {
    const result = await this.pool.query({
      name: 'migrator--table-exists',
      text: `
        SELECT * FROM "information_schema"."tables"
        WHERE "table_schema" = current_schema()
          AND "table_name" = $1
      `,
      values: [this.tableName],
    });
    console.log(result);
    return result.rowCount > 0;
  }

  public async createTable(): Promise<void> {
    const result = await this.pool.query({
      name: 'migrator--create-table',
      text: `
        CREATE TABLE "${this.tableName}" (
          "id" SERIAL NOT NULL,
          "key" character varying NOT NULL,
          "timestamp" timestamp NOT NULL,
          PRIMARY KEY ("id")
        )
      `,
      values: [],
    });
    console.log(result);
  }

  public async dropTable(): Promise<void> {
    const result = await this.pool.query({
      name: 'migrator--drop-table',
      text: `DROP TABLE IF EXISTS "${this.tableName}"`,
      values: [],
    });
    console.log(result);
  }

  public async getMigrationKeys(): Promise<string[]> {
    const result = await this.pool.query({
      name: 'migrator--get-keys',
      text: `SELECT key FROM "${this.tableName}"`,
      values: [],
    });
    console.log(result);
    return result.rows.map(row => row.key);
  }

  public async insertMigration(key: string): Promise<void> {

  }

  public async deleteMigrations(key: string): Promise<void> {

  }

}

export default Connector;
