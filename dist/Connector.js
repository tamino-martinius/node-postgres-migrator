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
    constructor(tableName = 'migrations', poolConfig) {
        this.tableName = tableName;
        this.pool = new pg_1.Pool(poolConfig);
        if (!this.isTableNameValid)
            throw `Invalid table name «${this.tableName}»`;
    }
    get isTableNameValid() {
        return /[a-z]([a-z0-9_])*/.test(this.tableName);
    }
    createDatabase() {
        return __awaiter(this, void 0, void 0, function* () {
            const pool = new pg_1.Pool({ database: 'postgres' });
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
            yield pool.end();
        });
    }
    dropDatabase() {
        return __awaiter(this, void 0, void 0, function* () {
            const pool = new pg_1.Pool({ database: 'postgres' });
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
            yield pool.end();
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
    up(migration) {
        return __awaiter(this, void 0, void 0, function* () {
            yield migration.up(this.pool);
        });
    }
    down(migration) {
        return __awaiter(this, void 0, void 0, function* () {
            yield migration.down(this.pool);
        });
    }
    disconnect() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.pool.totalCount > 0) {
                yield this.pool.end();
            }
        });
    }
}
exports.Connector = Connector;
exports.default = Connector;
//# sourceMappingURL=Connector.js.map