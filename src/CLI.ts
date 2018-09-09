import { resolve, basename } from 'path';
import {
  readdirSync,
  existsSync,
  mkdirSync,
  writeFileSync,
} from 'fs';
import { Migration } from './types';
import { Migrator } from './Migrator';
import { Connector } from './Connector';
import { version } from 'punycode';

export type Logger = (...params: any[]) => void;

export class CLI {
  folder: string;
  logger: Logger;

  constructor(logger: Logger = console.log) {
    this.logger = logger;
  }

  private envHelp() {
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
    this.logger('Usage: pg-migrator create_database [paramenters]');
    this.envHelp();
  }

  dropDatabaseHelp() {
    this.logger('Drops the database if already existing');
    this.logger('');
    this.logger('Usage: pg-migrator drop_database [paramenters]');
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

  private createFolder(path: string) {
    const parent = resolve(path, '..');
    if (!existsSync(parent)) this.createFolder(parent);
    if (!existsSync(path)) mkdirSync(path);
  }

  private get migrationsPath() {
    const folderParam = this.getParam('f', 'folder');
    const path = folderParam ? resolve(folderParam) : resolve('migrations');
    this.createFolder(path);
    return path;
  }

  private get migrationKeys() {
    const path = this.migrationsPath;
    const files = readdirSync(path);
    this.logger(this.migrationsPath);
    const jsFiles = files.filter(file => file.endsWith('.js'));
    return jsFiles.map(file => basename(file, '.js'));
  }

  private readMigration(key: string) {
    const path = this.migrationsPath;
    return { key, ...require(`${path}/${key}`) };
  }

  private get migrations(): Migration[] {
    return this.migrationKeys.map(key => this.readMigration(key));
  }

  private get migration(): Migration {
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
    throw `Unable to find migration - please provide either version or key`;
  }

  private getMigrator(tableName?: string) {
    return new Migrator(new Connector(tableName));
  }

  private getParam(shortKey: string, longKey: string) {
    const shortParam = `-${shortKey}`;
    const longParam = `--${longKey}=`;
    const argv = process.argv;
    let result: string | undefined = undefined;
    for (let index = 0; index < argv.length; index += 1) {
      const param = argv[index];
      if (param === shortParam) {
        const nextParam = argv[index + 1];
        if (nextParam) {
          if (!nextParam.startsWith('-')) {
            result = nextParam;
          } else {
            throw `Invalid parameter value for «${shortParam}»: «${nextParam}»`;
          }
        } else {
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
    const migrator = this.getMigrator();
    await migrator.up(this.migration);
    await migrator.connector.disconnect();
  }

  async down() {
    const migrator = this.getMigrator();
    await migrator.down(this.migration);
    await migrator.connector.disconnect();
  }

  async migrate() {
    const migrator = this.getMigrator();
    await migrator.migrate(this.migrations);
    await migrator.connector.disconnect();
  }

  async createDatabase() {
    const migrator = this.getMigrator();
    await migrator.connector.createDatabase();
    await migrator.connector.disconnect();
  }

  async dropDatabase() {
    const migrator = this.getMigrator();
    await migrator.connector.dropDatabase();
    await migrator.connector.disconnect();
  }

  get newVersion() {
    return new Date().toISOString().substr(0, 19).replace(/[-T:]/g, '');
  }

  create() {
    const name = process.argv[3];
    if (!name || name.length === 0 || name.startsWith('-')) {
      throw `Value missing for parameter «name»`;
    }

    // Template for node 8+
    const template = `const pg = require('pg');

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
  async up(client) {

    // remove async keyword when you are using a node version before 8

  },
  /**
   * Method to rollback migration
   * @param {pg.Pool} client
   * @returns {Promise<void>}
   */
  async down(client) {

    // remove async keyword when you are using a node version before 8

  },
}
`;
    const path = this.migrationsPath;
    writeFileSync(resolve(path, `${this.newVersion}_${name}.js`), template);
  }
}

export default CLI;
