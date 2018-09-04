import { context } from './types';
import {
  Migrator,
  Dict,
} from '..';

process.env.PGDATABASE = 'testcode';

describe('Migrator', () => {
  context('when no test is present', {
    definitions() {
      // overwrites
    },
    tests() {
      it('still passes', () => {
        expect(true).toBeTruthy();
      });
    },
  });

});
