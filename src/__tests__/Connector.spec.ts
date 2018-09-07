import { context } from './types';
import {
  Connector,
  Migration,
} from '..';

if (!process.env.PGDATABASE) process.env.PGDATABASE = 'testcode';

let connector: Connector | undefined;
let tableName: string | undefined;
const subject = () => {
  if (connector !== undefined) connector.disconnect();
  return connector = new Connector(tableName);
};

beforeAll(async () => {
  await subject().createDatabase();
});

afterAll(async () => {
  await subject().dropDatabase();
});

afterEach(async () => {
  if (connector !== undefined) {
    await connector.dropTable();
    await connector.disconnect();
  }
});

describe('Connector', () => {
  describe('#new', () => {
    context('when tableName is not present', {
      definitions() {
        tableName = undefined;
      },
      tests() {
        it('will set a default', () => {
          const connector = subject();
          expect(connector.tableName).toBeDefined();
          expect(typeof connector.tableName).toBe('string');
        });
      },
    });

    context('when tableName is passed', {
      definitions() {
        tableName = 'test';
      },
      tests() {
        it('will use passed value', () => {
          expect(subject().tableName).toBe(tableName);
        });
      },
    });
  });

  describe('#tableExists', () => {
    it('returns false', async () => {
      expect(await subject().tableExists()).toBe(false);
    });

    context('when table is created before', {
      async definitions() {
        await subject().createTable();
      },
      tests() {
        it('returns true', async () => {
          expect(await subject().tableExists()).toBe(true);
        });
      },
    });
  });

  describe('#createTable', () => {
    it('creates table', async () => {
      const connector = subject();
      expect(await connector.tableExists()).toBe(false);
      await connector.createTable();
      expect(await connector.tableExists()).toBe(true);
    });

    context('when table is created before', {
      async definitions() {
        await subject().createTable();
      },
      tests() {
        it('will raise an error', async () => {
          const connector = subject();
          expect(await connector.tableExists()).toBe(true);
          try {
            await connector.createTable();
          } catch (error) {
            return expect(error).toBeDefined();
          }
          expect(false).toBeTruthy(); // not expected to reach
        });
      },
    });
  });

  describe('#dropTable', () => {
    it('does nothing when no table present', async () => {
      const connector = subject();
      expect(await connector.tableExists()).toBe(false);
      await connector.dropTable();
      expect(await connector.tableExists()).toBe(false);
    });

    context('when table is created before', {
      async definitions() {
        await subject().createTable();
      },
      tests() {
        it('drops table', async () => {
          const connector = subject();
          expect(await connector.tableExists()).toBe(true);
          await connector.dropTable();
          expect(await connector.tableExists()).toBe(false);
        });
      },
    });
  });

  describe('#getMigrationKeys', () => {
    it('will raise error when no table is present', async () => {
      const connector = subject();
      expect(await connector.tableExists()).toBe(false);
      try {
        await connector.getMigrationKeys();
      } catch (error) {
        return expect(error).toBeDefined();
      }
      expect(false).toBeTruthy(); // not expected to reach
    });

    context('when table is created before', {
      async definitions() {
        await subject().createTable();
      },
      tests() {
        it('returns empty array', async () => {
          expect(await subject().getMigrationKeys()).toEqual([]);
        });

        context('when table has items', {
          async definitions() {
            await subject().insertMigrationKey('test');
          },
          tests() {
            it('returns existing item', async () => {
              expect(await subject().getMigrationKeys()).toEqual(['test']);
            });
          },
        });
      },
    });
  });

  describe('#insertMigrationKey', () => {
    it('will raise an error when no table is present', async () => {
      const connector = subject();
      expect(await connector.tableExists()).toBe(false);
      try {
        await connector.insertMigrationKey('test');
      } catch (error) {
        return expect(error).toBeDefined();
      }
      expect(false).toBeTruthy(); // not expected to reach
    });

    context('when table is created before', {
      async definitions() {
        await subject().createTable();
      },
      tests() {
        it('will create new key', async () => {
          const connector = subject();
          expect(await connector.getMigrationKeys()).toEqual([]);
          await connector.insertMigrationKey('test');
          expect(await connector.getMigrationKeys()).toEqual(['test']);
        });

        describe('when wrapped with transaction', () => {
          it('will create new', async () => {
            const connector = subject();

            expect(await connector.getMigrationKeys()).toEqual([]);
            await connector.beginTransaction();
            await connector.insertMigrationKey('test');
            await connector.endTransaction();
            expect(await connector.getMigrationKeys()).toEqual(['test']);
          });


          describe('when transaction ends with rollback', () => {
            it('will not create new', async () => {
              const connector = subject();

              expect(await connector.getMigrationKeys()).toEqual([]);
              await connector.beginTransaction();
              await connector.insertMigrationKey('test');
              await connector.rollbackTransaction();
              expect(await connector.getMigrationKeys()).toEqual([]);
            });
          });
        });

        context('when table already has this key', {
          async definitions() {
            await subject().insertMigrationKey('test');
          },
          tests() {
            it('will raise an error', async () => {
              const connector = subject();
              expect(await connector.getMigrationKeys()).toEqual(['test']);
              try {
                await connector.insertMigrationKey('test');
              } catch (error) {
                return expect(error).toBeDefined();
              }
              expect(false).toBeTruthy(); // not expected to reach
            });
          },
        });
      },
    });
  });

  describe('#deleteMigrationKey', () => {
    it('will raise an error when no table is present', async () => {
      const connector = subject();
      expect(await connector.tableExists()).toBe(false);
      try {
        await connector.deleteMigrationKey('test');
      } catch (error) {
        return expect(error).toBeDefined();
      }
      expect(false).toBeTruthy(); // not expected to reach
    });

    context('when table is created before', {
      async definitions() {
        await subject().createTable();
      },
      tests() {
        it('will not change anything', async () => {
          const connector = subject();
          expect(await connector.getMigrationKeys()).toEqual([]);
          await connector.deleteMigrationKey('test');
          expect(await connector.getMigrationKeys()).toEqual([]);
        });

        context('when table already has this key', {
          async definitions() {
            await subject().insertMigrationKey('test');
          },
          tests() {
            it('delete the existing key', async () => {
              const connector = subject();
              expect(await connector.getMigrationKeys()).toEqual(['test']);
              await connector.deleteMigrationKey('test');
              expect(await connector.getMigrationKeys()).toEqual([]);
            });
          },
        });

        context('when table already has another key', {
          async definitions() {
            await subject().insertMigrationKey('foo');
          },
          tests() {
            it('will keep existing key', async () => {
              const connector = subject();
              expect(await connector.getMigrationKeys()).toEqual(['foo']);
              await connector.deleteMigrationKey('test');
              expect(await connector.getMigrationKeys()).toEqual(['foo']);
            });
          },
        });
      },
    });
  });

  describe('#up', () => {
    let migration: Migration;
    const up = jest.fn();
    const down = jest.fn();

    context('when table is created before', {
      async definitions() {
        migration = {
          up,
          down,
          key: 'test',
        };
      },
      tests() {
        it('calls up with current pool', async () => {
          const connector = subject();
          expect(up).not.toHaveBeenCalledWith(connector.pool);
          expect(down).not.toHaveBeenCalledWith(connector.pool);
          await connector.up(migration);
          expect(up).toHaveBeenCalledWith(connector.pool);
          expect(down).not.toHaveBeenCalledWith(connector.pool);
        });
      },
    });
  });

  describe('#down', () => {
    let migration: Migration;
    const up = jest.fn();
    const down = jest.fn();

    context('when table is created before', {
      async definitions() {
        migration = {
          up,
          down,
          key: 'test',
        };
      },
      tests() {
        it('calls down with current pool', async () => {
          const connector = subject();
          expect(up).not.toHaveBeenCalledWith(connector.pool);
          expect(down).not.toHaveBeenCalledWith(connector.pool);
          await connector.down(migration);
          expect(up).not.toHaveBeenCalledWith(connector.pool);
          expect(down).toHaveBeenCalledWith(connector.pool);
        });
      },
    });
  });
});
