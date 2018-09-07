import { context } from './types';
import {
  Migration,
  CLI,
  Logger,
} from '..';

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

  describe('#help', () => {
    const subject = () => cli().help();

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

  describe('#migrateHelp', () => {
    const subject = () => cli().help();

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
