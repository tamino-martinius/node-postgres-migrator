import { Migration } from './types';
import { PoolConfig } from 'pg';
import { Connector } from './Connector';

export class Migrator {
  constructor(public tableName: string = 'migrations', public poolConfig?: PoolConfig) { }

  private connect() {
    return new Connector(this.tableName, this.poolConfig);
  }

  public async createDatabase() {
    const connector = this.connect();
    try {
      return await connector.createDatabase();
    } finally {
      await connector.disconnect();
    }
  }

  public async dropDatabase() {
    const connector = this.connect();
    try {
      return await connector.dropDatabase();
    } finally {
      await connector.disconnect();
    }
  }

  public async createTable() {
    const connector = this.connect();
    try {
      return await connector.createTable();
    } finally {
      await connector.disconnect();
    }
  }

  public async tableExists() {
    const connector = this.connect();
    try {
      return await connector.tableExists();
    } finally {
      await connector.disconnect();
    }
  }

  public async dropTable() {
    const connector = this.connect();
    try {
      return await connector.dropTable();
    } finally {
      await connector.disconnect();
    }
  }

  public async migrate(migrations: Migration[]): Promise<void> {
    const connector = this.connect();
    try {
      return await connector.migrate(migrations);
    } finally {
      await connector.disconnect();
    }
  }

  public async up(migration: Migration): Promise<void> {
    const connector = this.connect();
    try {
      return await connector.up(migration);
    } finally {
      await connector.disconnect();
    }
  }

  public async down(migration: Migration): Promise<void> {
    const connector = this.connect();
    try {
      return await connector.down(migration);
    } finally {
      await connector.disconnect();
    }
  }
}

export default Migrator;
