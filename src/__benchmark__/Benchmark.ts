export class Benchmark {
  constructor(public id: number) { }

  async setup(count: number): Promise<void> {
    console.log(count);
  }

  async teardown(): Promise<void> {
  }

  async main(): Promise<void> {
    throw 'must be implemented';
  }

  async run(samples: number): Promise<number[]> {
    const durations: number[] = [];
    Array.from({ length: samples }).forEach(async () => {
      const start = Date.now();
      await this.main();
      durations.push(Date.now() - start);
    });
    return durations;
  }
}
