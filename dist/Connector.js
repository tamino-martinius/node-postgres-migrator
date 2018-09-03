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
const migrator_1 = require("@nextcode/migrator");
const pg_1 = require("pg");
class Connector extends migrator_1.Connector {
    constructor(tableName = 'migrations') {
        super(tableName);
        this.tableName = tableName;
        this.pool = new pg_1.Pool();
        if (!this.isTableNameValid)
            throw `Invalid table name «${this.tableName}»`;
    }
    get isTableNameValid() {
        return /[a-z]([a-z0-9_])*/.test(this.tableName);
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
            console.log(result);
            return result.rowCount > 0;
        });
    }
    createTable() {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.pool.query({
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
        });
    }
    dropTable() {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.pool.query({
                name: 'migrator--drop-table',
                text: `DROP TABLE IF EXISTS "${this.tableName}"`,
                values: [],
            });
            console.log(result);
        });
    }
    getMigrationKeys() {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.pool.query({
                name: 'migrator--get-keys',
                text: `SELECT key FROM "${this.tableName}"`,
                values: [],
            });
            console.log(result);
            return result.rows.map(row => row.key);
        });
    }
    insertMigration(key) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.pool.query({
                name: 'migrator--insert-key',
                text: `
        INSERT INTO
        "${this.tableName}"("key", "timestamp")
        VALUES($1, current_timestamp)
      `,
                values: [key],
            });
            console.log(result);
        });
    }
    deleteMigrations(key) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.pool.query({
                name: 'migrator--delete-key',
                text: `
        DELETE FROM "${this.tableName}"
        WHERE key = $1
      `,
                values: [key],
            });
            console.log(result);
        });
    }
}
exports.Connector = Connector;
exports.default = Connector;
//# sourceMappingURL=Connector.js.map