import { context } from './types';
import {
  Migration,
  Migrator,
} from '..';

if (!process.env.PGDATABASE) process.env.PGDATABASE = 'testcode';

const connect = () => new Migrator();

afterEach(async () => {
  return await connect().dropTable();
});

beforeAll(async () => {
  await connect().createDatabase();
});

afterAll(async () => {
  return await connect().dropDatabase();
});

describe('Migrator', () => {
  describe('#migrate', () => {
    let migrations: Migration[] = [];
    const subject = () => connect().migrate(migrations);

    it('does not throw error', async () => {
      try {
        await subject();
      } catch (error) {
        expect(false).toBeTruthy(); // not expected to reach
      }
      expect(true).toBeTruthy();
    });

    context('when migration is present', {
      definitions() {
        migrations = [
          {
            key: 'test-1',
            up: jest.fn(),
            down: jest.fn(),
          },
        ];
      },
      tests() {
        it('applies migration', async () => {
          const fn = migrations[0].up;
          await subject();
          expect(fn).toBeCalled();
        });

        context('when running migrate multiple times', {
          definitions() {
            migrations = [
              {
                key: 'test-1a',
                up: jest.fn(),
                down: jest.fn(),
              },
            ];
          },
          tests() {
            it('applies migration', async () => {
              let fn = migrations[0].up;
              await subject();
              expect(fn).toBeCalled();
              migrations = [
                {
                  key: 'test-1b',
                  up: jest.fn(),
                  down: jest.fn(),
                },
              ];
              fn = migrations[0].up;
              await subject();
              expect(fn).toBeCalled();
            });

            context('when key was already applied', {
              definitions() {
                migrations = [
                  {
                    key: 'test-2a',
                    up: jest.fn(),
                    down: jest.fn(),
                  },
                ];
              },
              tests() {
                it('skips second migration migration', async () => {
                  let fn = migrations[0].up;
                  await subject();
                  expect(fn).toBeCalled();
                  migrations = [
                    {
                      key: 'test-2a',
                      up: jest.fn(),
                      down: jest.fn(),
                    },
                  ];
                  fn = migrations[0].up;
                  await subject();
                  expect(fn).not.toBeCalled();
                });
              },
            });

            context('when parent key was already applied', {
              definitions() {
                migrations = [
                  {
                    key: 'test-3a',
                    up: jest.fn(),
                    down: jest.fn(),
                  },
                ];
              },
              tests() {
                it('applies migration', async () => {
                  let fn = migrations[0].up;
                  await subject();
                  expect(fn).toBeCalled();
                  migrations = [
                    {
                      parent: ['test-3a'],
                      key: 'test-3b',
                      up: jest.fn(),
                      down: jest.fn(),
                    },
                  ];
                  fn = migrations[0].up;
                  await subject();
                  expect(fn).toBeCalled();
                });
              },
            });
          },
        });
      },
    });

    context('when migration has invalid parent', {
      definitions() {
        migrations = [
          {
            parent: ['test-0'],
            key: 'test-1',
            up: jest.fn(),
            down: jest.fn(),
          },
        ];
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

    context('when migration throws error', {
      definitions() {
        migrations = [
          {
            key: 'test-1',
            up: () => { throw 'error'; },
            down: jest.fn(),
          },
        ];
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

    context('when migrations parent build infinite loop', {
      definitions() {
        migrations = [
          {
            parent: ['test-1'],
            key: 'test-0',
            up: jest.fn(),
            down: jest.fn(),
          },
          {
            parent: ['test-0'],
            key: 'test-1',
            up: jest.fn(),
            down: jest.fn(),
          },
        ];
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

  describe('#up', () => {
    let migration: Migration = {
      key: 'test-1',
      up: jest.fn(),
      down: jest.fn(),
    };

    const subject = () => connect().up(migration);

    context('when migration is present', {
      definitions() {
        migration = {
          key: 'test-up-1',
          up: jest.fn(),
          down: jest.fn(),
        };
      },
      tests() {
        it('applies migration', async () => {
          const fn = migration.up;
          await subject();
          expect(fn).toBeCalled();
        });
      },
    });

    context('when migration has invalid parent', {
      definitions() {
        migration = {
          parent: ['test-0'],
          key: 'test-up-2',
          up: jest.fn(),
          down: jest.fn(),
        };
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

    context('when migration throws error', {
      definitions() {
        migration = {
          key: 'test-up-3',
          up: () => { throw 'error'; },
          down: jest.fn(),
        };
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

  describe('#down', () => {
    let migration: Migration = {
      key: 'test-1',
      up: jest.fn(),
      down: jest.fn(),
    };

    const subject = () => connect().down(migration);

    context('when migration is present', {
      definitions() {
        migration = {
          key: 'test-down-1',
          up: jest.fn(),
          down: jest.fn(),
        };
      },
      tests() {
        it('rolls back migration', async () => {
          const fn = migration.down;
          await subject();
          expect(fn).toBeCalled();
        });
      },
    });

    context('when migration has invalid parent', {
      definitions() {
        migration = {
          parent: ['test-0'],
          key: 'test-down-2',
          up: jest.fn(),
          down: jest.fn(),
        };
      },
      tests() {
        it('rolls back migration', async () => {
          const fn = migration.down;
          await subject();
          expect(fn).toBeCalled();
        });
      },
    });

    context('when migration throws error', {
      definitions() {
        migration = {
          key: 'test-down-3',
          up: jest.fn(),
          down: () => { throw 'error'; },
        };
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

  describe('#dropTable', () => {
    const subject = () => connect().dropTable();

    it('does nothing when no table present', async () => {
      const migrator = connect();
      expect(await migrator.tableExists()).toBe(false);
      await subject();
      expect(await migrator.tableExists()).toBe(false);
    });

    context('when table is created before', {
      async definitions() {
        await connect().createTable();
      },
      tests() {
        it('drops table', async () => {
          const migrator = await connect();
          expect(await migrator.tableExists()).toBe(true);
          await subject();
          expect(await migrator.tableExists()).toBe(false);
        });
      },
    });
  });
});
