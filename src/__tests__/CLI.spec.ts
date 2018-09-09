import { context } from './types';
import { resolve } from 'path';
import {
  CLI,
  Connector,
  Logger,
} from '..';

if (!process.env.PGDATABASE) process.env.PGDATABASE = 'testcode';

beforeAll(async () => {
  const connector = new Connector();
  await connector.createDatabase();
  await connector.disconnect();
});

afterAll(async () => {
  const connector = new Connector();
  await connector.dropDatabase();
  await connector.disconnect();
});

afterEach(async () => {
  const connector = new Connector();
  try {
    await connector.dropTable();
  } catch (error) {
    // errors are expected here
  } finally {
    await connector.disconnect();
  }
});

let logger: Logger | undefined;
const cli = () => new CLI(logger);

describe('CLI', () => {
  describe('#new', () => {
    context('when logger is not present', {
      definitions() {
        logger = undefined;
      },
      tests() {
        it('will set console.log as default', () => {
          const connector = cli();
          expect(connector.logger).toBe(console.log);
        });
      },
    });

    context('when logger is passed', {
      definitions() {
        logger = jest.fn();
      },
      tests() {
        it('will use passed logger', () => {
          expect(cli().logger).toBe(logger);
        });
      },
    });
  });

  [
    'help',
    'migrateHelp',
    'upHelp',
    'downHelp',
    'createDatabaseHelp',
    'dropDatabaseHelp',
    'createHelp',
  ].forEach((helpCommand) => {
    describe(`#${helpCommand}`, () => {
      const subject = () => cli()[helpCommand]();

      context('when logger is present', {
        definitions() {
          logger = jest.fn();
        },
        tests() {
          it('writes logs', () => {
            expect(logger).not.toHaveBeenCalled();
            subject();
            expect(logger).toHaveBeenCalled();
          });
        },
      });
    });
  });

  [
    'up',
    'down',
  ].forEach((command) => {
    describe(`#${command}`, () => {
      const subject = () => cli()[command]();
      const up = jest.fn();
      jest.mock('../Migrator');

      context('when just no arguments are present', {
        definitions() {
          process.argv = [];
        },
        tests() {
          it('throws error', async () => {
            try {
              await subject();
            } catch (error) {
              return expect(error).toBeDefined();
            }
            expect(false).toBeTruthy(); // not expected to reach
          });
        },
      });

      context('when just folder arguments is present', {
        definitions() {
          process.argv = ['-f', resolve(__dirname)];
        },
        tests() {
          it('throws error', async () => {
            try {
              await subject();
            } catch (error) {
              return expect(error).toBeDefined();
            }
            expect(false).toBeTruthy(); // not expected to reach
          });
        },
      });

      context('when folder argument is incomplete', {
        definitions() {
          process.argv = ['-f'];
        },
        tests() {
          it('throws error', async () => {
            try {
              await subject();
            } catch (error) {
              return expect(error).toBeDefined();
            }
            expect(false).toBeTruthy(); // not expected to reach
          });
        },
      });

      context('when folder argument is directly followed by next', {
        definitions() {
          process.argv = ['-f', '-v'];
        },
        tests() {
          it('throws error', async () => {
            try {
              await subject();
            } catch (error) {
              return expect(error).toBeDefined();
            }
            expect(false).toBeTruthy(); // not expected to reach
          });
        },
      });

      context('when just key arguments is present', {
        definitions() {
          process.argv = ['-k', 'test_migration'];
        },
        tests() {
          it('throws error', async () => {
            try {
              await subject();
            } catch (error) {
              return expect(error).toBeDefined();
            }
            expect(false).toBeTruthy(); // not expected to reach
          });
        },
      });

      context('when key and folder arguments are present', {
        definitions() {
          process.argv = ['-f', resolve(__dirname), '-k', 'test_migration'];
        },
        tests() {
          it('reads migration from folder', async () => {
            await subject();
          });
        },
      });

      context('when key and folder arguments are present with long notation', {
        definitions() {
          process.argv = [`--folder=${resolve(__dirname)}`, '--key=test_migration'];
        },
        tests() {
          it('reads migration from folder', async () => {
            await subject();
          });
        },
      });

      context('when version and folder arguments are present', {
        definitions() {
          process.argv = ['-f', resolve(__dirname), '-v', 'test'];
        },
        tests() {
          it('reads migration from folder', async () => {
            await subject();
          });
        },
      });
    });
  });
});
