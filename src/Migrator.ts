import { ConnectionConfig, Connector } from './Connector';

import { Migration } from './types';
import { basename } from 'path';
import { readdirSync } from 'fs';

export class Migrator {
  public tableName: string = 'migrations';
  public config: ConnectionConfig | undefined;

  constructor(config?: ConnectionConfig & { tableName?: string }) {
    if (config) {
      if (config.tableName) {
        this.tableName = config.tableName;
      }
      delete config.tableName;
      this.config = config;
    }
  }

  private connect() {
    return new Connector(this.tableName, this.config);
  }

  public async createDatabase() {
    const connector = this.connect();
    try {
      await connector.createDatabase();
    } finally {
      await connector.disconnect();
    }
  }

  public async dropDatabase() {
    const connector = this.connect();
    try {
      await connector.dropDatabase();
    } finally {
      await connector.disconnect();
    }
  }

  public async createTable() {
    const connector = this.connect();
    try {
      await connector.createTable();
    } finally {
      await connector.disconnect();
    }
  }

  public async tableExists() {
    const connector = this.connect();
    let result = false;
    try {
      result = await connector.tableExists();
    } finally {
      await connector.disconnect();
      return result;
    }
  }

  public async dropTable() {
    const connector = this.connect();
    try {
      await connector.dropTable();
    } finally {
      await connector.disconnect();
    }
  }

  public async migrate(migrations: Migration[]): Promise<void> {
    const connector = this.connect();
    try {
      await connector.migrate(migrations);
    } finally {
      await connector.disconnect();
    }
  }

  public async up(migration: Migration): Promise<void> {
    const connector = this.connect();
    try {
      await connector.up(migration);
    } finally {
      await connector.disconnect();
    }
  }

  public async down(migration: Migration): Promise<void> {
    const connector = this.connect();
    try {
      await connector.down(migration);
    } finally {
      await connector.disconnect();
    }
  }

  public static getMigrationFileNamesFromPath(path: string) {
    const files = readdirSync(path);
    const jsFiles = files.filter(file => file.endsWith('.js'));
    return jsFiles.map(file => basename(file, '.js'));
  }

  public static readMigrationFromPath(path: string, fileName: string) {
    return { version: fileName.split(/[-_]/)[0], ...require(`${path}/${fileName}`) };
  }

  public static getMigrationsFromPath(path: string): Migration[] {
    return this.getMigrationFileNamesFromPath(path).map(name =>
      this.readMigrationFromPath(path, name),
    );
  }
}

export default Migrator;
