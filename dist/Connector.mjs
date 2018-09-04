import { Pool } from 'pg';
export class Connector {
    constructor(tableName = 'migrations') {
        this.tableName = tableName;
        this.pool = new Pool();
        if (!this.isTableNameValid)
            throw `Invalid table name «${this.tableName}»`;
    }
    get isTableNameValid() {
        return /[a-z]([a-z0-9_])*/.test(this.tableName);
    }
    async tableExists() {
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
    async createIndex() {
        await this.pool.query({
            name: 'migrator--create-idnex',
            text: `CREATE UNIQUE INDEX "${this.tableName}__key" ON "${this.tableName}" ("key");`,
            values: [],
        });
    }
    async createTable() {
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
    async dropIndex() {
        await this.pool.query({
            name: 'migrator--drop-index',
            text: `DROP INDEX IF EXISTS "${this.tableName}__key"`,
            values: [],
        });
    }
    async dropTable() {
        await this.dropIndex();
        await this.pool.query({
            name: 'migrator--drop-table',
            text: `DROP TABLE IF EXISTS "${this.tableName}"`,
            values: [],
        });
    }
    async getMigrationKeys() {
        const result = await this.pool.query({
            name: 'migrator--get-keys',
            text: `SELECT key FROM "${this.tableName}"`,
            values: [],
        });
        return result.rows.map(row => row.key);
    }
    async insertMigrationKey(key) {
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
    async deleteMigrationKey(key) {
        await this.pool.query({
            name: 'migrator--delete-key',
            text: `
        DELETE FROM "${this.tableName}"
        WHERE key = $1
      `,
            values: [key],
        });
    }
    async beginTransaction() {
        await this.pool.query({
            name: 'migrator--begin-transaction',
            text: 'BEGIN',
            values: [],
        });
    }
    async endTransaction() {
        await this.pool.query({
            name: 'migrator--end-transaction',
            text: 'COMMIT',
            values: [],
        });
    }
    async rollbackTransaction() {
        await this.pool.query({
            name: 'migrator--rollback-transaction',
            text: 'ROLLBACK',
            values: [],
        });
    }
    async disconnect() {
        if (this.pool.totalCount > 0) {
            await this.pool.end();
        }
    }
}
export default Connector;
//# sourceMappingURL=Connector.mjs.map