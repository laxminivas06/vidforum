import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/api-response';

export function errorMiddleware(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('Unhandled API Error:', {
    path: req.path,
    method: req.method,
    error: err?.message || err,
    stack: process.env.NODE_ENV === 'development' ? err?.stack : undefined,
  });

  if (err.name === 'ZodError') {
    sendError(res, 'Validation error', 422, 'VALIDATION_FAILED', err.errors);
    return;
  }

  if (err.code === '23505') {
    sendError(res, 'Conflict: Record with unique identifier already exists', 409, 'UNIQUE_VIOLATION', err.detail);
    return;
  }

  if (err.code === '23503') {
    sendError(res, 'Foreign key constraint violation: referenced entity does not exist', 400, 'FOREIGN_KEY_VIOLATION', err.detail);
    return;
  }

  sendError(
    res,
    err.message || 'Internal server error',
    err.statusCode || 500,
    err.errorCode || 'INTERNAL_SERVER_ERROR'
  );
}
