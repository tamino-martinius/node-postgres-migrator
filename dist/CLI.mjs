import { resolve, basename } from 'path';
import { readdirSync, existsSync, mkdirSync, writeFileSync, } from 'fs';
import { Migrator } from './Migrator';
export class CLI {
    constructor(logger = console.log) {
        this.logger = logger;
    }
    envHelp() {
        this.logger('');
        this.logger('Environment variables:');
        this.logger('  PGHOST             Host of postgres server');
        this.logger('  PGPORT             Port of postgres server ');
        this.logger('  PGUSER             Username of postgres user');
        this.logger('  PGPASSWORD         Password of postgres user');
        this.logger('  PGDATABASE         Database Name');
    }
    help() {
        this.logger('Usage: pg-migrator <command> [paramenters]');
        this.logger('To see help text, you can run:');
        this.logger('');
        this.logger('  pg-migrator help');
        this.logger('  pg-migrator <command> help');
        this.logger('');
        this.logger('Commands:');
        this.logger('  migrate            Applies all pending migrations from the given folder');
        this.logger('  up                 Applies the migration');
        this.logger('  down               Does a rollback of the migration');
        this.logger('  create             Creates a empty migration with the given name');
        this.logger('  createDatabase     Creates the database if not already existing');
        this.logger('  dropDatabase       Drops the database if already existing');
        this.logger('  dropTable          Drops the migration table');
        this.logger('  help               Shows this overview');
    }
    migrateHelp() {
        this.logger('Applies all pending migrations from the given folder');
        this.logger('');
        this.logger('Usage: pg-migrator migrate [paramenters]');
        this.logger('');
        this.logger('Options:');
        this.logger('  -f, --folder       Folder which contains the migrations');
        this.logger('                     (default: migrations)');
        this.envHelp();
    }
    upHelp() {
        this.logger('Applies the migration');
        this.logger('');
        this.logger('Usage: pg-migrator up [paramenters]');
        this.logger('');
        this.logger('Options:');
        this.logger('  -f, --folder       Folder which contains the migrations');
        this.logger('                     (default: migrations)');
        this.logger('  -k, --key          Key of the migration');
        this.logger('  -v, --version      Version of the migration (first part of key)');
        this.envHelp();
    }
    downHelp() {
        this.logger('Does a rollback of the migration');
        this.logger('');
        this.logger('Usage: pg-migrator down [paramenters]');
        this.logger('');
        this.logger('Options:');
        this.logger('  -f, --folder       Folder which contains the migrations');
        this.logger('                     (default: migrations)');
        this.logger('  -k, --key          Key of the migration');
        this.logger('  -v, --version      Version of the migration (first part of key)');
        this.envHelp();
    }
    createDatabaseHelp() {
        this.logger('Creates the database if not already existing');
        this.logger('');
        this.logger('Usage: pg-migrator createDatabase [paramenters]');
        this.envHelp();
    }
    dropDatabaseHelp() {
        this.logger('Drops the database if already existing');
        this.logger('');
        this.logger('Usage: pg-migrator dropDatabase [paramenters]');
        this.envHelp();
    }
    dropTableHelp() {
        this.logger('Drops the migration table');
        this.logger('');
        this.logger('Usage: pg-migrator dropTable [paramenters]');
        this.envHelp();
    }
    createHelp() {
        this.logger('Creates a empty migration with the given name');
        this.logger('');
        this.logger('Usage: pg-migrator create <name> [paramenters]');
        this.logger('  -f, --folder       Folder which contains the migrations');
        this.logger('                     (default: migrations)');
        this.envHelp();
    }
    createFolder(path) {
        const parent = resolve(path, '..');
        if (!existsSync(parent))
            this.createFolder(parent);
        if (!existsSync(path))
            mkdirSync(path);
    }
    get migrationsPath() {
        const folderParam = this.getParam('f', 'folder');
        const path = folderParam ? resolve(folderParam) : resolve('migrations');
        this.createFolder(path);
        return path;
    }
    get migrationKeys() {
        const path = this.migrationsPath;
        const files = readdirSync(path);
        this.logger(this.migrationsPath);
        const jsFiles = files.filter(file => file.endsWith('.js'));
        return jsFiles.map(file => basename(file, '.js'));
    }
    readMigration(key) {
        const path = this.migrationsPath;
        return { key, ...require(`${path}/${key}`) };
    }
    get migrations() {
        return this.migrationKeys.map(key => this.readMigration(key));
    }
    get migration() {
        const path = this.migrationsPath;
        const keys = this.migrationKeys;
        const keyParam = this.getParam('k', 'key');
        const versionParam = this.getParam('v', 'version');
        if (keyParam && keyParam.length > 0) {
            if (keys.indexOf(keyParam) < 0) {
                throw `Unable to find key «${keyParam}» in folder «${path}»`;
            }
            return this.readMigration(keyParam);
        }
        if (versionParam && versionParam.length > 0) {
            for (const key of keys) {
                if (key.startsWith(`${versionParam}_`) || key.startsWith(`${versionParam}-`)) {
                    return this.readMigration(key);
                }
            }
            throw `Unable to find version «${versionParam}» in folder «${path}»`;
        }
        throw 'Unable to find migration - please provide either version or key';
    }
    getMigrator(tableName) {
        return new Migrator(tableName);
    }
    getParam(shortKey, longKey) {
        const shortParam = `-${shortKey}`;
        const longParam = `--${longKey}=`;
        const argv = process.argv;
        let result = undefined;
        for (let index = 0; index < argv.length; index += 1) {
            const param = argv[index];
            if (param === shortParam) {
                const nextParam = argv[index + 1];
                if (nextParam) {
                    if (!nextParam.startsWith('-')) {
                        result = nextParam;
                    }
                    else {
                        throw `Invalid parameter value for «${shortParam}»: «${nextParam}»`;
                    }
                }
                else {
                    throw `Value missing for parameter «${shortParam}»`;
                }
            }
            if (param.startsWith(longParam)) {
                result = param.substr(longParam.length);
            }
        }
        return result;
    }
    async up() {
        await this.getMigrator().up(this.migration);
    }
    async down() {
        await this.getMigrator().down(this.migration);
    }
    async migrate() {
        await this.getMigrator().migrate(this.migrations);
    }
    async createDatabase() {
        await this.getMigrator().createDatabase();
    }
    async dropDatabase() {
        await this.getMigrator().dropDatabase();
    }
    async dropTable() {
        await this.getMigrator().dropTable();
    }
    get newVersion() {
        return new Date().toISOString().substr(0, 19).replace(/[-T:]/g, '');
    }
    get nodeVersion() {
        if (this.cachedNodeVersion)
            return this.cachedNodeVersion;
        const version = Number(((process.version).match(/^v(\d+\.\d+)/) || ['', '0'])[1]);
        return this.cachedNodeVersion = version;
    }
    get template() {
        return `const pg = require('pg');

/**
 * Description of the Migration
 */
module.exports = {
  parent: undefined,
  /**
   * Method to apply migration
   * @param {pg.Pool} client
   * @returns {Promise<void>}
   */
  ${this.nodeVersion > 7 ? 'async ' : ''}up(client) {

    // ${this.nodeVersion > 7 ? 'Code for Migration' : 'Return Promise for Migration'}

  },
  /**
   * Method to rollback migration
   * @param {pg.Pool} client
   * @returns {Promise<void>}
   */
  ${this.nodeVersion > 7 ? 'async ' : ''}down(client) {

    // ${this.nodeVersion > 7 ? 'Code for Rollback' : 'Return Promise for Rollback'}

  },
}
`;
    }
    create() {
        const name = process.argv[3];
        if (!name || name.length === 0 || name.startsWith('-')) {
            throw `Value missing for parameter «${name}»`;
        }
        const path = this.migrationsPath;
        writeFileSync(resolve(path, `${this.newVersion}_${name}.js`), this.template);
    }
}
export default CLI;
//# sourceMappingURL=CLI.mjs.map