import { context } from './types';
import { resolve } from 'path';
import { readdirSync } from 'fs';
import {
  CLI,
  Connector,
  Logger,
} from '..';

if (!process.env.PGDATABASE) process.env.PGDATABASE = 'testcode';

let logger: Logger | undefined;
const cli = () => new CLI(logger);

beforeAll(async () => {
  await cli().createDatabase();
});

afterAll(async () => {
  await cli().dropDatabase();
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
            const fn = require('./test_migration')[command];
            fn.mockClear();
            expect(fn).not.toBeCalled();
            await subject();
            expect(fn).toBeCalled();
          });
        },
      });

      context('when key and folder arguments are present with long notation', {
        definitions() {
          process.argv = [`--folder=${resolve(__dirname)}`, '--key=test_migration'];
        },
        tests() {
          it('reads migration from folder', async () => {
            const fn = require('./test_migration')[command];
            fn.mockClear();
            expect(fn).not.toBeCalled();
            await subject();
            expect(fn).toBeCalled();
          });
        },
      });

      context('when version and folder arguments are present', {
        definitions() {
          process.argv = ['-f', resolve(__dirname), '-v', 'test'];
        },
        tests() {
          it('reads migration from folder', async () => {
            const fn = require('./test_migration')[command];
            fn.mockClear();
            expect(fn).not.toBeCalled();
            await subject();
            expect(fn).toBeCalled();
          });
        },
      });

      context('when version is not present', {
        definitions() {
          process.argv = ['-f', resolve(__dirname), '-v', 'foo'];
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
    });
  });

  describe('#migrate', () => {
    const subject = () => cli().migrate();

    context('when folder arguments are present', {
      definitions() {
        process.argv = ['-f', resolve(__dirname)];
      },
      tests() {
        it('reads migration from folder', async () => {
          const fn = require('./test_migration').up;
          fn.mockClear();
          expect(fn).not.toBeCalled();
          await subject();
          expect(fn).toBeCalled();
        });
      },
    });

    context('when folder argument is present with long notation', {
      definitions() {
        process.argv = [`--folder=${resolve(__dirname)}`];
      },
      tests() {
        it('reads migration from folder', async () => {
          const fn = require('./test_migration').up;
          fn.mockClear();
          expect(fn).not.toBeCalled();
          await subject();
          expect(fn).toBeCalled();
        });
      },
    });
  });

  describe('#create', () => {
    const subject = () => cli().create();

    context('when name argument is not present', {
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


    context('when name arguments is present', {
      definitions() {
        process.argv = ['-f', resolve(__dirname), 'create', 'test'];
      },
      tests() {
        it('creates new migration in test folder', async () => {
          const fileCount = readdirSync(resolve(__dirname)).length;
          await subject();
          expect(readdirSync(resolve(__dirname)).length).toBe(fileCount + 1);
        });
      },
    });
  });
});
