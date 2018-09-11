import { Benchmark } from './Benchmark';
import { Connector, Dict } from '..';

export interface BenchmarkRun {
  title: string;
  count: number;
  duration: number;
}

process.env.PGDATABASE = process.env.PGDATABASE || 'pg-migrator--compare-benchmark';

export class Compare {
  constructor(public benchmarkModels: Dict<typeof Benchmark>) { }
  currentId = 0;

  get nextId() {
    return this.currentId += 1;
  }

  async setup() {
    console.log('setup compare');

    const connector = new Connector();
    await connector.createDatabase();
    await connector.disconnect();
  }

  async teardown() {
    console.log('teardown compare');

    const connector = new Connector();
    await connector.dropDatabase();
    await connector.disconnect();
  }

  async run(from: number, to: number, step: number, samples: number = 10) {
    const results: BenchmarkRun[] = [];
    try {
      await this.setup();
      for (const title in this.benchmarkModels) {
        const benchmarkModel = this.benchmarkModels[title];
        for (let count = from; count <= to; count += step) {
          const benchmark = new benchmarkModel(this.nextId);
          await benchmark.setup(count);
          const durations = await benchmark.run(samples);
          await benchmark.teardown();
          const runs = durations.map(duration => ({ duration, count, title }));
          console.log(runs);
          results.push(...runs);
        }
      }
    } finally {
      await this.teardown();
    }
    console.log('title', 'count', 'duration');
    results.map(run => console.log(run.title, run.count, run.duration));
    return results;
  }
}
