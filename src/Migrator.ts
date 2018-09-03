import { Dict, Migration } from './types';
import { Connector } from './Connector';

export class Migrator {
  migrationPromises: Dict<Promise<void>> = {};
  migrationStatus: Dict<boolean> = {};
  initStatus: boolean | Promise<void> = false;
  lastMigration: string | undefined;

  constructor(public connector: Connector) { }

  async init(): Promise<void> {
    if (this.initStatus === true) return Promise.resolve();
    if (this.initStatus === false) {
      return this.initStatus = new Promise(async (resolve, reject) => {
        const migrationTableExists = await this.connector.tableExists();
        if (!migrationTableExists) await this.connector.createTable();
        const migrationKeys = await this.connector.getMigrationKeys();
        for (const key of migrationKeys) {
          this.migrationStatus[key] = true;
          this.migrationPromises[key] = Promise.resolve();
          this.lastMigration = key;
        }
        resolve();
      });
    }
    return this.initStatus;
  }
}

export default Migrator;
