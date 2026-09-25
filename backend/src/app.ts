import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import apiV1Router from './routes/api.v1';
import { errorMiddleware } from './middleware/error.middleware';
import { sendError } from './utils/api-response';

export const app: Express = express();

// Security & Parsing Middlewares
app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(cors({
  origin: env.CORS_ORIGIN,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Institution-Id', 'X-User-Id'],
  credentials: true,
}));
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Root welcome
app.get('/', (_req: Request, res: Response) => {
  res.json({
    name: 'VID Platform API',
    description: 'Multi-Tenant Educational Operating Ecosystem',
    version: '1.0.0',
    documentation: '/api/v1/health',
  });
});

// Versioned API Gateway
app.use('/api/v1', apiV1Router);

// 404 Not Found Handler
app.use((req: Request, res: Response) => {
  sendError(res, `Route not found: ${req.method} ${req.path}`, 404, 'NOT_FOUND');
});

// Centralized Error Handler
app.use(errorMiddleware);
