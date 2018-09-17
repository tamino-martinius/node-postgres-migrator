"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
class Connector {
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
        return this.cachedPool = new pg_1.Pool(this.poolConfig);
    }
    get isTableNameValid() {
        return /[a-z]([a-z0-9_])*/.test(this.tableName);
    }
    createIndex() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.pool.query({
                name: 'migrator--create-idnex',
                text: `CREATE UNIQUE INDEX "${this.tableName}__key" ON "${this.tableName}" ("key");`,
                values: [],
            });
        });
    }
    createTable() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.pool.query({
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
            yield this.createIndex();
        });
    }
    dropIndex() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.pool.query({
                name: 'migrator--drop-index',
                text: `DROP INDEX IF EXISTS "${this.tableName}__key"`,
                values: [],
            });
        });
    }
    getMigrationKeys() {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.pool.query({
                name: 'migrator--get-keys',
                text: `SELECT key FROM "${this.tableName}"`,
                values: [],
            });
            return result.rows.map(row => row.key);
        });
    }
    insertMigrationKey(key) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.pool.query({
                name: 'migrator--insert-key',
                text: `
        INSERT INTO
        "${this.tableName}"("key", "timestamp")
        VALUES($1, current_timestamp)
      `,
                values: [key],
            });
        });
    }
    deleteMigrationKey(key) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.pool.query({
                name: 'migrator--delete-key',
                text: `
        DELETE FROM "${this.tableName}"
        WHERE key = $1
      `,
                values: [key],
            });
        });
    }
    beginTransaction() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.pool.query({
                name: 'migrator--begin-transaction',
                text: 'BEGIN',
                values: [],
            });
        });
    }
    endTransaction() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.pool.query({
                name: 'migrator--end-transaction',
                text: 'COMMIT',
                values: [],
            });
        });
    }
    rollbackTransaction() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.pool.query({
                name: 'migrator--rollback-transaction',
                text: 'ROLLBACK',
                values: [],
            });
        });
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.initStatus === true)
                return Promise.resolve();
            if (this.initStatus === false) {
                return this.initStatus = new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
                    const migrationTableExists = yield this.tableExists();
                    if (!migrationTableExists)
                        yield this.createTable();
                    const migrationKeys = yield this.getMigrationKeys();
                    for (const key of migrationKeys) {
                        this.migrationStatus[key] = true;
                        this.migrationPromises[key] = Promise.resolve();
                        this.lastMigration = key;
                    }
                    resolve();
                }));
            }
        });
    }
    tableExists() {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.pool.query({
                name: 'migrator--table-exists',
                text: `
        SELECT * FROM "information_schema"."tables"
        WHERE "table_schema" = current_schema()
          AND "table_name" = $1
      `,
                values: [this.tableName],
            });
            return result.rowCount > 0;
        });
    }
    createDatabase() {
        return __awaiter(this, void 0, void 0, function* () {
            const pool = new pg_1.Pool({ database: 'postgres' });
            try {
                const result = yield pool.query({
                    name: 'migrator--test--database-exists',
                    text: `
          SELECT 1
          FROM pg_database
          WHERE datname = '${process.env.PGDATABASE}'
        `,
                    values: [],
                });
                if (result.rows.length === 0) {
                    yield pool.query({
                        name: 'migrator--test--create-database',
                        text: `CREATE DATABASE "${process.env.PGDATABASE}"`,
                        values: [],
                    });
                }
            }
            finally {
                this.disconnect(pool);
            }
        });
    }
    dropDatabase() {
        return __awaiter(this, void 0, void 0, function* () {
            const pool = new pg_1.Pool({ database: 'postgres' });
            try {
                const result = yield pool.query({
                    name: 'migrator--test--database-exists',
                    text: `
          SELECT 1
          FROM pg_database
          WHERE datname = '${process.env.PGDATABASE}'
        `,
                    values: [],
                });
                if (result.rows.length > 0) {
                    yield pool.query({
                        name: 'migrator--test--drop-database',
                        text: `DROP DATABASE "${process.env.PGDATABASE}"`,
                        values: [],
                    });
                }
            }
            finally {
                this.disconnect(pool);
            }
        });
    }
    dropTable() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.dropIndex();
            yield this.pool.query({
                name: 'migrator--drop-table',
                text: `DROP TABLE IF EXISTS "${this.tableName}"`,
                values: [],
            });
        });
    }
    migrate(migrations) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.init();
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
            yield Promise.all(promises);
        });
    }
    up(migration) {
        return __awaiter(this, void 0, void 0, function* () {
            const parent = migration.parent || (this.lastMigration ? [this.lastMigration] : []);
            const parentPromises = parent.map((key) => {
                const process = this.migrationPromises[key];
                if (!process)
                    throw `Parent Migration «${key}» missing.`;
                return process;
            });
            this.lastMigration = migration.key;
            return this.migrationPromises[migration.key] = new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                yield this.init();
                yield Promise.all(parentPromises);
                try {
                    yield this.beginTransaction();
                    yield migration.up(this.pool);
                    yield this.insertMigrationKey(migration.key);
                    yield this.endTransaction();
                    this.migrationStatus[migration.key] = true;
                }
                catch (error) {
                    yield this.rollbackTransaction();
                    return reject(error);
                }
                resolve();
            }));
        });
    }
    down(migration) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.init();
            try {
                yield this.beginTransaction();
                yield migration.down(this.pool);
                yield this.deleteMigrationKey(migration.key);
                yield this.endTransaction();
                delete this.migrationPromises[migration.key];
                delete this.migrationStatus[migration.key];
            }
            catch (error) {
                yield this.rollbackTransaction();
                throw error;
            }
        });
    }
    disconnect(pool = this.pool) {
        return __awaiter(this, void 0, void 0, function* () {
            if (pool.totalCount > 0) {
                yield pool.end();
            }
        });
    }
}
exports.Connector = Connector;
exports.default = Connector;
//# sourceMappingURL=Connector.js.map