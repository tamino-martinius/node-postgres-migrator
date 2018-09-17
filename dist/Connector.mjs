import { Pool } from 'pg';
export class Connector {
    constructor(tableName, poolConfig) {
        this.tableName = tableName;
        this.poolConfig = poolConfig;
        this.migrationPromises = {};
        this.migrationStatus = {};
        this.initStatus = false;
        if (!this.isTableNameValid)
            throw `Invalid table name «${this.tableName}»`;
    }
    get pool() {
        if (this.cachedPool)
            return this.cachedPool;
        return this.cachedPool = new Pool(this.poolConfig);
    }
    get isTableNameValid() {
        return /[a-z]([a-z0-9_])*/.test(this.tableName);
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
    async init() {
        if (this.initStatus === true)
            return Promise.resolve();
        if (this.initStatus === false) {
            return this.initStatus = new Promise(async (resolve) => {
                const migrationTableExists = await this.tableExists();
                if (!migrationTableExists)
                    await this.createTable();
                const migrationKeys = await this.getMigrationKeys();
                for (const key of migrationKeys) {
                    this.migrationStatus[key] = true;
                    this.migrationPromises[key] = Promise.resolve();
                    this.lastMigration = key;
                }
                resolve();
            });
        }
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
    async createDatabase() {
        const pool = new Pool({ database: 'postgres' });
        try {
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
        }
        finally {
            this.disconnect(pool);
        }
    }
    async dropDatabase() {
        const pool = new Pool({ database: 'postgres' });
        try {
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
        }
        finally {
            this.disconnect(pool);
        }
    }
    async dropTable() {
        await this.dropIndex();
        await this.pool.query({
            name: 'migrator--drop-table',
            text: `DROP TABLE IF EXISTS "${this.tableName}"`,
            values: [],
        });
    }
    async migrate(migrations) {
        await this.init();
        const promises = [];
        let migrationCount = migrations.length;
        const migrationKeyLookup = {};
        migrations.map(migration => migrationKeyLookup[migration.key] = true);
        while (migrationCount > 0) {
            let index = 0;
            while (index < migrations.length) {
                const migration = migrations[index];
                let processMigration = true;
                if (this.migrationStatus[migration.key]) {
                    migrations.splice(index, 1);
                    continue;
                }
                if (migration.parent !== undefined) {
                    for (const key of migration.parent) {
                        if (!this.migrationPromises[key]) {
                            if (!migrationKeyLookup[key]) {
                                throw `Parent «${key}» not found for migration «${migrations[0].key}».`;
                            }
                            processMigration = false;
                            break;
                        }
                    }
                }
                if (processMigration) {
                    promises.push(this.up(migration));
                    migrations.splice(index, 1);
                }
                else {
                    index += 1;
                }
            }
            if (migrationCount === migrations.length) {
                throw `
          Migrations build a infinite loop.
          Unable to add keys «${migrations.map(migration => migration.key).join('», «')}».
        `;
            }
            migrationCount = migrations.length;
        }
        await Promise.all(promises);
    }
    async up(migration) {
        const parent = migration.parent || (this.lastMigration ? [this.lastMigration] : []);
        const parentPromises = parent.map((key) => {
            const process = this.migrationPromises[key];
            if (!process)
                throw `Parent Migration «${key}» missing.`;
            return process;
        });
        this.lastMigration = migration.key;
        return this.migrationPromises[migration.key] = new Promise(async (resolve, reject) => {
            await this.init();
            await Promise.all(parentPromises);
            try {
                await this.beginTransaction();
                await migration.up(this.pool);
                await this.insertMigrationKey(migration.key);
                await this.endTransaction();
                this.migrationStatus[migration.key] = true;
            }
            catch (error) {
                await this.rollbackTransaction();
                return reject(error);
            }
            resolve();
        });
    }
    async down(migration) {
        await this.init();
        try {
            await this.beginTransaction();
            await migration.down(this.pool);
            await this.deleteMigrationKey(migration.key);
            await this.endTransaction();
            delete this.migrationPromises[migration.key];
            delete this.migrationStatus[migration.key];
        }
        catch (error) {
            await this.rollbackTransaction();
            throw error;
        }
    }
    async disconnect(pool = this.pool) {
        if (pool.totalCount > 0) {
            await pool.end();
        }
    }
}
export default Connector;
//# sourceMappingURL=Connector.mjs.map