import { Pool } from 'pg';

export interface Dict<T> {
  [key: string]: T;
}

export interface Migration {
  key: string;
  up(client: Pool): Promise<any>;
  down(client: Pool): Promise<any>;
  parent?: string[];
}
