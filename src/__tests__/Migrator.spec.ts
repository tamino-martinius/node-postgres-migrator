import { context } from './types';
import {
  Connector,
  Migration,
  Migrator,
} from '..';

if (!process.env.PGDATABASE) process.env.PGDATABASE = 'testcode';

let lastMigrator: Migrator | undefined;
const migrator = () => {
  if (lastMigrator) lastMigrator.connector.disconnect();
  return lastMigrator = new Migrator(new Connector());
};

beforeAll(async () => {
  const connector = new Connector();
  await connector.createDatabase();
  await connector.disconnect();
});

afterAll(async () => {
  if (lastMigrator) lastMigrator.connector.disconnect();
  const connector = new Connector();
  await connector.dropDatabase();
  await connector.disconnect();
});

describe('Migrator', () => {
  describe('#migrate', () => {
    let migrations: Migration[] = [];
    const subject = () => migrator().migrate(migrations);

    it('does not throw error', async () => {
      expect(subject).not.toThrowError();
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
});
