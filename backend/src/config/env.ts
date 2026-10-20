import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
// Fall back to the monorepo root .env (dotenv never overrides keys already set above)
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export const env = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL || '',
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: parseInt(process.env.DB_PORT || '5432', 10),
  DB_USER: process.env.DB_USER || 'postgres',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  DB_NAME: process.env.DB_NAME || 'postgres',
  DB_SSL: process.env.DB_SSL === 'true' || process.env.NODE_ENV === 'production',
  JWT_SECRET: process.env.JWT_SECRET || 'vid-platform-dev-jwt-secret-replace-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  DEFAULT_INITIAL_PASSWORD: process.env.DEFAULT_INITIAL_PASSWORD || 'admin123',
  // Voice Agent Configuration
  SARVAM_API_KEY: process.env.SARVAM_API_KEY || '',
  SARVAM_DEFAULT_VOICE: process.env.SARVAM_DEFAULT_VOICE || 'priya',
  SARVAM_DEFAULT_LANGUAGE: process.env.SARVAM_DEFAULT_LANGUAGE || 'te-IN',
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',
  GROQ_MODEL: process.env.GROQ_MODEL || 'qwen/qwen3.8-27b',
  LIVEKIT_URL: process.env.LIVEKIT_URL || '',
  LIVEKIT_API_KEY: process.env.LIVEKIT_API_KEY || '',
  LIVEKIT_API_SECRET: process.env.LIVEKIT_API_SECRET || '',
  EXOTEL_ACCOUNT_SID: process.env.EXOTEL_ACCOUNT_SID || '',
  EXOTEL_SUBDOMAIN: process.env.EXOTEL_SUBDOMAIN || 'api.exotel.com',
  EXOTEL_REGION: process.env.EXOTEL_REGION || 'Singapore',
  EXOTEL_API_KEY: process.env.EXOTEL_API_KEY || '',
  EXOTEL_API_TOKEN: process.env.EXOTEL_API_TOKEN || '',
  EXOTEL_CALLER_ID: process.env.EXOTEL_CALLER_ID || '+918047123456',
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || '',
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || '',
  TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER || '',
  TELEPHONY_PROVIDER: process.env.TELEPHONY_PROVIDER || 'auto',
  get PUBLIC_BASE_URL(): string {
    return process.env.PUBLIC_BASE_URL || '';
  },
  WHATSAPP_API_TOKEN: process.env.WHATSAPP_API_TOKEN || process.env.META_WHATSAPP_TOKEN || '',
  WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID || process.env.META_PHONE_NUMBER_ID || '',
  META_WHATSAPP_TOKEN: process.env.META_WHATSAPP_TOKEN || process.env.WHATSAPP_API_TOKEN || '',
  META_PHONE_NUMBER_ID: process.env.META_PHONE_NUMBER_ID || process.env.WHATSAPP_PHONE_NUMBER_ID || '',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  DEFAULT_TENANT_ID: process.env.DEFAULT_TENANT_ID || '00000000-0000-0000-0000-000000000001',
  // Optional: private object storage for face reference photos (fail-open when unset)
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  FACE_PHOTO_BUCKET: process.env.FACE_PHOTO_BUCKET || 'face-photos',
};
