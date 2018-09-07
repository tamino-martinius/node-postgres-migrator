import { context } from './types';
import {
  Migration,
  CLI,
  Logger,
} from '..';
import Migrator from '../Migrator';

let logger: Logger | undefined;
const cli = () => new CLI(logger);

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
});
