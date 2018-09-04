import { context } from './types';
import { Pool } from 'pg';
import {
  Migrator,
  Dict,
} from '..';
import { Connector } from '../Connector';

if (!process.env.PGDATABASE) process.env.PGDATABASE = 'testcode';

beforeAll(async () => {
  const pool = new Pool({ database: 'postgres' });
  const result = await pool.query({
    name: 'migrator--test--database-exists',
    text: `
      SELECT 1
      FROM pg_database
      WHERE datname = '${process.env.PGDATABASE}'
    `,
    values: [],
  });
  if (result.rows.length === 0) {
    await pool.query({
      name: 'migrator--test--create-database',
      text: `CREATE DATABASE "${process.env.PGDATABASE}"`,
      values: [],
    });
  }
  await pool.end();
});

afterAll(async () => {
  const pool = new Pool({ database: 'postgres' });
  const result = await pool.query({
    name: 'migrator--test--database-exists',
    text: `
      SELECT 1
      FROM pg_database
      WHERE datname = '${process.env.PGDATABASE}'
    `,
    values: [],
  });
  if (result.rows.length > 0) {
    await pool.query({
      name: 'migrator--test--drop-database',
      text: `DROP DATABASE "${process.env.PGDATABASE}"`,
      values: [],
    });
  }
  await pool.end();
});

describe('Connector', () => {
  let tableName: string | undefined;
  let connector: Connector | undefined;

  const subject = () => {
    if (connector !== undefined) connector.disconnect();
    return connector = new Connector(tableName);
  };

  afterEach(async () => {
    if (connector !== undefined) {
      await connector.dropTable();
      await connector.disconnect();
    }
  });

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
  });

  });
});
