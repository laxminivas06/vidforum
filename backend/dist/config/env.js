"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
exports.env = {
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
