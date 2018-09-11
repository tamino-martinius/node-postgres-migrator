# Postgres Migrator

[![Build Status](https://travis-ci.org/tamino-martinius/node-pg-migrator.svg?branch=master)](https://travis-ci.org/tamino-martinius/node-pg-migrator)
[![codecov](https://codecov.io/gh/tamino-martinius/node-pg-migrator/branch/master/graph/badge.svg)](https://codecov.io/gh/tamino-martinius/node-pg-migrator)

Migrations for [Postgres](https://www.npmjs.com/package/pg).

## Whats different in this package compared to most others?

- This package has 0 dependencies (just postgres itself as peer dependency)
- Support of parallel migrations when the parent migrations are defined
- Ships with TypeScript types, commonJs (.js) and module exports (.mjs)

## Status

WIP - This package is currently in development with the first alpha released.

- [x] Up
- [x] Down
- [x] Migrate
- [x] Transactions
- [x] Single Rollback
- [ ] Cascading Rollback
- [x] CLI
- [x] API
- [ ] Documentation
- [x] Benchmark

## Changelog

See [history](HISTORY.md) for more details.

* `1.0.0` **2018-xx-xx** Initial release
