# Postgres Migrator

[![Build Status](https://travis-ci.org/tamino-martinius/node-pg-migrator.svg?branch=master)](https://travis-ci.org/tamino-martinius/node-pg-migrator)
[![codecov](https://codecov.io/gh/tamino-martinius/node-pg-migrator/branch/master/graph/badge.svg)](https://codecov.io/gh/tamino-martinius/node-pg-migrator)

Migrations for [Postgres](https://www.npmjs.com/package/pg).

## Whats different in this package compared to most others?

- This package has 0 dependencies (just postgres itself as peer dependency)
- Support of parallel migrations when the dependent migrations are defined
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

## CLI

### Getting Help**

`pg-migrator help`

Lists all commands.

`pg-migrator <command> help`

Lists command details and parameters.

**Parameters**

All commands with Database interactions allow all of the following Environment variables:

- `PGHOST` Host of postgres server
- `PGPORT` Port of postgres server
- `PGUSER` Username of postgres user
- `PGPASSWORD` Password of postgres user
- `PGDATABASE` Database Name

All commands use the `migrations` folder to locate migrations.
This can be changed with the `-f` or the `--folder` parameter.

The commands `up` and `down` also provide parameters to select a single migrations.

Use -n or --name to select migration by passing full filename without extension.
You can also use -v or --version to select migration by version (first part of filename).

### Create Migrations

Creates a new migration file prefixed with current timestamp to the `migrations` folder.
You can pass a different folder with the `-f` or `--folder` parameter.

`pg-commander create <name>`

### Migrate

Applies all pending migrations.

`pg-migrator migrate`

Applies/Rolls back just the selected migration.

`pg-migrator up`

`pg-migrator down`

### Create / Drop Database

Tries to create or drop the database.

`pg-migrator createDatabase`

`pg-migrator dropDatabase`

### Drop Table

Drops the migration table from the database.

`pg-migrator dropTable`
## Changelog

See [history](HISTORY.md) for more details.

* `1.0.0` **2018-xx-xx** Initial release
