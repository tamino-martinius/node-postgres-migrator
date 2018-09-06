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

export class CLI {
  folder: string;

  private envHelp() {
    console.log('');
    console.log('Environment variables:');
    console.log('  PGHOST             Host of postgres server');
    console.log('  PGPORT             Port of postgres server ');
    console.log('  PGUSER             Username of postgres user');
    console.log('  PGPASSWORD         Password of postgres user');
    console.log('  PGDATABASE         Database Name');
  }

  help() {
    console.log('Usage: pg-migrator <command> [paramenters]');
    console.log('To see help text, you can run:');
    console.log('');
    console.log('  pg-migrator help');
    console.log('  pg-migrator <command> help');
  }

  migrateHelp() {
    console.log('Applies all pending migrations from the given folder');
    console.log('');
    console.log('Usage: pg-migrator migrate [paramenters]');
    console.log('');
    console.log('Options:');
    console.log('  -f, --folder       Folder which contains the migrations');
    console.log('                     (default: migrations)');
    this.envHelp();
  }

  upHelp() {
    console.log('Applies the migration');
    console.log('');
    console.log('Usage: pg-migrator up [paramenters]');
    console.log('');
    console.log('Options:');
    console.log('  -f, --folder       Folder which contains the migrations');
    console.log('                     (default: migrations)');
    console.log('  -k, --key          Key of the migration');
    console.log('  -v, --version      Version of the migration (first part of key)');
    this.envHelp();
  }

  downHelp() {
    console.log('Does a rollback of the migration');
    console.log('');
    console.log('Usage: pg-migrator down [paramenters]');
    console.log('');
    console.log('Options:');
    console.log('  -f, --folder       Folder which contains the migrations');
    console.log('                     (default: migrations)');
    console.log('  -k, --key          Key of the migration');
    console.log('  -v, --version      Version of the migration (first part of key)');
    this.envHelp();
  }

  createDatabaseHelp() {
    console.log('Creates the database if not already existing');
    console.log('');
    console.log('Usage: pg-migrator create_database [paramenters]');
    this.envHelp();
  }

  dropDatabaseHelp() {
    console.log('Drops the database if already existing');
    console.log('');
    console.log('Usage: pg-migrator drop_database [paramenters]');
    this.envHelp();
  }

  createHelp() {
    console.log('Creates a empty migration with the given name');
    console.log('');
    console.log('Usage: pg-migrator create <name> [paramenters]');
    console.log('  -f, --folder       Folder which contains the migrations');
    console.log('                     (default: migrations)');
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
    console.log(this.migrationsPath);
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
        if (key.startsWith(`${version}_`) || key.startsWith(`${version}-`)) {
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
  }

  async down() {
    const migrator = this.getMigrator();
    await migrator.up(this.migration);
  }

  async migrate() {
    const migrator = this.getMigrator();
    await migrator.migrate(this.migrations);
  }

  async createDatabase() {
    const migrator = this.getMigrator();
    await migrator.connector.createDatabase();
  }

  async dropDatabase() {
    const migrator = this.getMigrator();
    await migrator.connector.dropDatabase();
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
