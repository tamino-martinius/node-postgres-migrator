import { MigrateSequential } from './MigrateSequential';
import { MigrateMixed } from './MigrateMixed';
import { MigrateParallel } from './MigrateParallel';

import { Compare } from '../Compare';

const compareMigrate = new Compare({
  sequential: MigrateSequential,
  mixed: MigrateMixed,
  parallel: MigrateParallel,
});

compareMigrate.run(100, 1000, 100, 10);
