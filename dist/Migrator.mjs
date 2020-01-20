import { Connector } from './Connector';
export class Migrator {
    constructor(config) {
        this.tableName = 'migrations';
        if (config) {
            if (config.tableName) {
                this.tableName = config.tableName;
            }
            delete config.tableName;
            this.config = config;
        }
    }
    connect() {
        return new Connector(this.tableName, this.config);
    }
    async createDatabase() {
        const connector = this.connect();
        try {
            await connector.createDatabase();
        }
        finally {
            await connector.disconnect();
        }
    }
    async dropDatabase() {
        const connector = this.connect();
        try {
            await connector.dropDatabase();
        }
        finally {
            await connector.disconnect();
        }
    }
    async createTable() {
        const connector = this.connect();
        try {
            await connector.createTable();
        }
        finally {
            await connector.disconnect();
        }
    }
    async tableExists() {
        const connector = this.connect();
        let result = false;
        try {
            result = await connector.tableExists();
        }
        finally {
            await connector.disconnect();
            return result;
        }
    }
    async dropTable() {
        const connector = this.connect();
        try {
            await connector.dropTable();
        }
        finally {
            await connector.disconnect();
        }
    }
    async migrate(migrations) {
        const connector = this.connect();
        try {
            await connector.migrate(migrations);
        }
        finally {
            await connector.disconnect();
        }
    }
    async up(migration) {
        const connector = this.connect();
        try {
            await connector.up(migration);
        }
        finally {
            await connector.disconnect();
        }
    }
    async down(migration) {
        const connector = this.connect();
        try {
            await connector.down(migration);
        }
        finally {
            await connector.disconnect();
        }
    }
}
export default Migrator;
//# sourceMappingURL=Migrator.mjs.map