import { Pool } from 'pg';

/*
 * Description of the Migration
 */

// Migration depends on these versions
export const parent: string[] | undefined = undefined;

// Method to apply migration
export const up = async (client: Pool) => {

  // Code for Migration

};

// Method to rollback migration
export const down = async (client: Pool) => {

  // Code for Rollback

};
