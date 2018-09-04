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
  });

});
