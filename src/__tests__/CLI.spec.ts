import { context } from './types';
import { resolve } from 'path';
import { readdirSync, unlinkSync } from 'fs';
import {
  CLI,
  Logger,
} from '..';

if (!process.env.PGDATABASE) process.env.PGDATABASE = 'testcode';

let logger: Logger | undefined;
const connect = () => new CLI(logger);

beforeAll(async () => {
  return await connect().createDatabase();
});

afterAll(async () => {
  return await connect().dropDatabase();
});

afterEach(async () => {
  return await connect().dropTable();
});

describe('CLI', () => {
  describe('#new', () => {
    const subject = () => connect();

    context('when logger is not present', {
      definitions() {
        logger = undefined;
      },
      tests() {
        it('will set console.log as default', () => {
          expect(subject().logger).toBe(console.log);
        });
      },
    });

    context('when logger is passed', {
      definitions() {
        logger = jest.fn();
      },
      tests() {
        it('will use passed logger', () => {
          expect(subject().logger).toBe(logger);
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
      const subject = () => connect()[helpCommand]();

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
      const subject = () => connect()[command]();

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
    const subject = () => connect().migrate();

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
    const subject = () => connect().create();

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
          const files = readdirSync(resolve(__dirname));
          await subject();
          const newFiles = readdirSync(resolve(__dirname)).filter(file => !files.includes(file));
          expect(newFiles.length).toBe(1);
          unlinkSync(resolve(__dirname, newFiles[0]));
        });
      },
    });
  });

  if (connect().nodeVersion > 7) {
    const version = process.version;
    describe('#template', () => {
      const subject = () => connect().template;

      context('when version allows async/await', {
        definitions() {
          Object.defineProperty(process, 'version', { value: 'v8.0.0' });
        },
        reset() {
          Object.defineProperty(process, 'version', { value: version });
        },
        tests() {
          it('uses async', async () => {
            expect(await subject()).toContain('async');
          });
        },
      });

      context('when version does not allow async/await', {
        definitions() {
          Object.defineProperty(process, 'version', { value: 'v6.0.0' });
        },
        reset() {
          Object.defineProperty(process, 'version', { value: version });
        },
        tests() {
          it('does not use async', async () => {
            expect(await subject()).not.toContain('async');
          });
        },
      });
    });
  }
});
