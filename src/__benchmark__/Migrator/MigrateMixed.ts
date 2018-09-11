import { Migrate } from './Migrate';

export class MigrateMixed extends Migrate {
  async setup(count: number) {
    await super.setup(count);
    Array.from({ length: count }).forEach((_, i) => {
      const parent = i % 2 === 0 ? [] : Array.from({ length: i % 3 }).map(
        () => this.migrations[~~(Math.random() * this.migrations.length)].key,
      );
      this.migrations.push({ ...this.migration, parent });
    });
  }
}
