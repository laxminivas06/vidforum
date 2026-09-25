"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.pool = void 0;
const pg_1 = require("pg");
const env_1 = require("./env");
exports.pool = new pg_1.Pool({
    host: env_1.env.DB_HOST,
    port: env_1.env.DB_PORT,
    user: env_1.env.DB_USER,
    password: env_1.env.DB_PASSWORD,
    database: env_1.env.DB_NAME,
    ssl: {
        rejectUnauthorized: false,
    },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
});
exports.pool.on('error', (err) => {
    console.error('Unexpected database pool error on client:', err);
});
exports.db = {
    async query(text, params) {
        const start = Date.now();
        try {
            const res = await exports.pool.query(text, params);
            const duration = Date.now() - start;
            if (process.env.DEBUG_SQL === 'true') {
                console.log('Executed query', { text: text.slice(0, 80), duration, rows: res.rowCount });
            }
            return res;
        }
        catch (error) {
            console.error('Database query error:', { text, error });
            throw error;
        }
    },
    async getClient() {
        const client = await exports.pool.connect();
        return client;
    },
    async testConnection() {
        try {
            const res = await exports.pool.query('SELECT NOW() as current_time, count(*) as tables FROM information_schema.tables WHERE table_schema = \'public\';');
            console.log(` Connected to Supabase PostgreSQL! DB Time: ${res.rows[0].current_time}, Tables: ${res.rows[0].tables}`);
            return true;
        }
        catch (error) {
            console.error(' Database connection test failed:', error);
            return false;
        }
    }
};
