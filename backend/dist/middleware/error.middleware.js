"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMiddleware = errorMiddleware;
const api_response_1 = require("../utils/api-response");
function errorMiddleware(err, req, res, next) {
    console.error('Unhandled API Error:', {
        path: req.path,
        method: req.method,
        error: err?.message || err,
        stack: process.env.NODE_ENV === 'development' ? err?.stack : undefined,
    });
    if (err.name === 'ZodError') {
        (0, api_response_1.sendError)(res, 'Validation error', 422, 'VALIDATION_FAILED', err.errors);
        return;
    }
    if (err.code === '23505') {
        (0, api_response_1.sendError)(res, 'Conflict: Record with unique identifier already exists', 409, 'UNIQUE_VIOLATION', err.detail);
        return;
    }
    if (err.code === '23503') {
        (0, api_response_1.sendError)(res, 'Foreign key constraint violation: referenced entity does not exist', 400, 'FOREIGN_KEY_VIOLATION', err.detail);
        return;
    }
    (0, api_response_1.sendError)(res, err.message || 'Internal server error', err.statusCode || 500, err.errorCode || 'INTERNAL_SERVER_ERROR');
}
