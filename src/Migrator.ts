import { Dict, Migration } from './types';
import { Connector } from './Connector';

export class Migrator {
  migrationPromises: Dict<Promise<void>> = {};
  migrationStatus: Dict<boolean> = {};
  initStatus: boolean | Promise<void> = false;
  lastMigration: string | undefined;

  constructor(public connector: Connector) { }
}

export default Migrator;
