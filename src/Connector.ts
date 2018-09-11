import { Pool, PoolConfig } from 'pg';
import { Migration } from './types';

export class Connector {
  pool: Pool;

  constructor(public tableName: string = 'migrations', poolConfig?: PoolConfig) {
    this.pool = new Pool(poolConfig);
    if (!this.isTableNameValid) throw `Invalid table name «${this.tableName}»`;
  }

  private get isTableNameValid() {
    return /[a-z]([a-z0-9_])*/.test(this.tableName);
  }

  public async createDatabase() {
    const pool = new Pool({ database: 'postgres' });
    const result = await pool.query({
      name: 'migrator--test--database-exists',
      text: `
        SELECT 1
        FROM pg_database
        WHERE datname = '${process.env.PGDATABASE}'
      `,
      values: [],
    });
    if (result.rows.length === 0) {
      await pool.query({
        name: 'migrator--test--create-database',
        text: `CREATE DATABASE "${process.env.PGDATABASE}"`,
        values: [],
      });
    }
    await pool.end();
  }

  public async dropDatabase() {
    const pool = new Pool({ database: 'postgres' });
    const result = await pool.query({
      name: 'migrator--test--database-exists',
      text: `
        SELECT 1
        FROM pg_database
        WHERE datname = '${process.env.PGDATABASE}'
      `,
      values: [],
    });
    if (result.rows.length > 0) {
      await pool.query({
        name: 'migrator--test--drop-database',
        text: `DROP DATABASE "${process.env.PGDATABASE}"`,
        values: [],
      });
    }
    await pool.end();
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

  public async up(migration: Migration): Promise<void> {
    await migration.up(this.pool);
  }

  public async down(migration: Migration): Promise<void> {
    await migration.down(this.pool);
  }

  public async disconnect(): Promise<void> {
    if (this.pool.totalCount > 0) {
      await this.pool.end();
    }
  }
}

export default Connector;
