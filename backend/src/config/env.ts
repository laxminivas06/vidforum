import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const env = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres.cyvckmjocomqzipbvbpv:.$wm*J8buiDHxXQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres',
  DB_HOST: process.env.DB_HOST || 'aws-0-ap-northeast-2.pooler.supabase.com',
  DB_PORT: parseInt(process.env.DB_PORT || '5432', 10),
  DB_USER: process.env.DB_USER || 'postgres.cyvckmjocomqzipbvbpv',
  DB_PASSWORD: process.env.DB_PASSWORD || '.$wm*J8buiDHxXQ',
  DB_NAME: process.env.DB_NAME || 'postgres',
  DB_SSL: process.env.DB_SSL === 'true' || true,
  JWT_SECRET: process.env.JWT_SECRET || 'super-secret-vid-platform-jwt-token-key-2026-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
};
