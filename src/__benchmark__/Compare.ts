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
    const connector = new Connector();
    await connector.createDatabase();
    await connector.disconnect();
  }

  async teardown() {
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
        const countProcesses: Promise<void>[] = [];
        for (let count = from; count <= to; count += step) {
          countProcesses.push((async (count: number) => {
            const durationProcesses = Array.from({ length: samples }).map(async () => {
              const benchmark = new benchmarkModel(this.nextId);
              console.log(benchmark.id);
              await benchmark.setup(count);
              const duration = await benchmark.run();
              await benchmark.teardown();
              console.log(benchmark.id);
              return duration;
            });
            const durations = await Promise.all(durationProcesses);
            results.push(...durations.map(duration => ({ title, count, duration })));
          })(count));
        }
        await Promise.all(countProcesses);
      }
    } catch (error) {
      console.log({ error });
    } finally {
      await this.teardown();
    }
    console.log('title', 'count', 'duration');
    results.map(run => console.log(run.title, run.count, run.duration));
    return results;
  }
}
