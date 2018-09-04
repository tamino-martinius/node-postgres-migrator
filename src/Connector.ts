import { Pool } from 'pg';

export class Connector {
  private pool: Pool;

  constructor(public tableName: string = 'migrations') {
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
    return result.rowCount > 0;
  }

  private async createIndex(): Promise<void> {
    await this.pool.query({
      name: 'migrator--create-idnex',
      text: `CREATE UNIQUE INDEX "${this.tableName}__key" ON "${this.tableName}" ("key");`,
      values: [],
    });
  }

  public async createTable(): Promise<void> {
    await this.pool.query({
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
    await this.createIndex();
  }

  private async dropIndex(): Promise<void> {
    await this.pool.query({
      name: 'migrator--drop-index',
      text: `DROP INDEX IF EXISTS "${this.tableName}__key"`,
      values: [],
    });

  }

  public async dropTable(): Promise<void> {
    await this.dropIndex();
    await this.pool.query({
      name: 'migrator--drop-table',
      text: `DROP TABLE IF EXISTS "${this.tableName}"`,
      values: [],
    });
  }

  public async getMigrationKeys(): Promise<string[]> {
    const result = await this.pool.query({
      name: 'migrator--get-keys',
      text: `SELECT key FROM "${this.tableName}"`,
      values: [],
    });
    return result.rows.map(row => row.key);
  }

  public async insertMigrationKey(key: string): Promise<void> {
    await this.pool.query({
      name: 'migrator--insert-key',
      text: `
        INSERT INTO
        "${this.tableName}"("key", "timestamp")
        VALUES($1, current_timestamp)
      `,
      values: [key],
    });
  }

  public async deleteMigrationKey(key: string): Promise<void> {
    await this.pool.query({
      name: 'migrator--delete-key',
      text: `
        DELETE FROM "${this.tableName}"
        WHERE key = $1
      `,
      values: [key],
    });
  }

  public async beginTransaction(): Promise<void> {
    await this.pool.query({
      name: 'migrator--begin-transaction',
      text: 'BEGIN',
      values: [],
    });
  }

  public async endTransaction(): Promise<void> {
    await this.pool.query({
      name: 'migrator--end-transaction',
      text: 'COMMIT',
      values: [],
    });
  }

  public async rollbackTransaction(): Promise<void> {
    await this.pool.query({
      name: 'migrator--rollback-transaction',
      text: 'ROLLBACK',
      values: [],
    });
  }

  public async disconnect(): Promise<void> {
    if (this.pool.totalCount > 0) {
      await this.pool.end();
    }
  }
}

export default Connector;
