import { Benchmark } from '../Benchmark';
import { Migrator, Migration, Connector } from '../..';

export class Migrate extends Benchmark {
  lastIndex = 0;
  migrations: Migration[] = [];
  tableName = `benchmark-${this.id}`;
  migrator = new Migrator(new Connector(this.tableName));

  get simulateWork() {
    return new Promise((resolve) => {
      setTimeout(
        () => {
          resolve();
        },
        ~~(Math.random() * 1000),
      );
    });
  }

  get migration(): Migration {
    return {
      key: `example-${this.lastIndex += 1}`,
      up: () => this.simulateWork,
      down: () => this.simulateWork,
    };
  }

  async setup(_: number) {
    console.log('setup', this.tableName);

    await this.migrator.connector.createTable();
  }

  async teardown() {
    console.log('teardown', this.tableName);
    await this.migrator.connector.dropTable();
    await this.migrator.connector.disconnect();
  }

  async main() {
    await this.migrator.migrate(this.migrations);
  }
}
