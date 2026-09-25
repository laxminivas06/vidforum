import { Pool, QueryResult, QueryResultRow } from 'pg';
import { env } from './env';

export const pool = new Pool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('Unexpected database pool error on client:', err);
});

export const db = {
  async query<T extends QueryResultRow = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
    const start = Date.now();
    try {
      const res = await pool.query<T>(text, params);
      const duration = Date.now() - start;
      if (process.env.DEBUG_SQL === 'true') {
        console.log('Executed query', { text: text.slice(0, 80), duration, rows: res.rowCount });
      }
      return res;
    } catch (error) {
      console.error('Database query error:', { text, error });
      throw error;
    }
  },

  async getClient() {
    const client = await pool.connect();
    return client;
  },

  async testConnection(): Promise<boolean> {
    try {
      const res = await pool.query('SELECT NOW() as current_time, count(*) as tables FROM information_schema.tables WHERE table_schema = \'public\';');
      console.log(` Connected to Supabase PostgreSQL! DB Time: ${res.rows[0].current_time}, Tables: ${res.rows[0].tables}`);
      return true;
    } catch (error) {
      console.error(' Database connection test failed:', error);
      return false;
    }
  }
};
