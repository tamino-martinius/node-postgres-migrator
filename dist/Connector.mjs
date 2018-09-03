import { Connector as AbstractConnector } from '@nextcode/migrator';
import { Pool } from 'pg';
export class Connector extends AbstractConnector {
    constructor(tableName = 'migrations') {
        super(tableName);
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
        console.log(result);
        return result.rowCount > 0;
    }
    async createTable() {
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
    async dropTable() {
        const result = await this.pool.query({
            name: 'migrator--drop-table',
            text: `DROP TABLE IF EXISTS "${this.tableName}"`,
            values: [],
        });
        console.log(result);
    }
    async getMigrationKeys() {
        const result = await this.pool.query({
            name: 'migrator--get-keys',
            text: `SELECT key FROM "${this.tableName}"`,
            values: [],
        });
        console.log(result);
        return result.rows.map(row => row.key);
    }
    async insertMigration(key) {
        const result = await this.pool.query({
            name: 'migrator--insert-key',
            text: `
        INSERT INTO
        "${this.tableName}"("key", "timestamp")
        VALUES($1, current_timestamp)
      `,
            values: [key],
        });
        console.log(result);
    }
    async deleteMigrations(key) {
        const result = await this.pool.query({
            name: 'migrator--delete-key',
            text: `
        DELETE FROM "${this.tableName}"
        WHERE key = $1
      `,
            values: [key],
        });
        console.log(result);
    }
}
export default Connector;
//# sourceMappingURL=Connector.mjs.map