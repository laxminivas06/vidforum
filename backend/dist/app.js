"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const env_1 = require("./config/env");
const api_v1_1 = __importDefault(require("./routes/api.v1"));
const error_middleware_1 = require("./middleware/error.middleware");
const api_response_1 = require("./utils/api-response");
exports.app = (0, express_1.default)();
// Security & Parsing Middlewares
exports.app.use((0, helmet_1.default)({
    contentSecurityPolicy: false,
}));
exports.app.use((0, cors_1.default)({
    origin: env_1.env.CORS_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Institution-Id', 'X-User-Id'],
    credentials: true,
}));
exports.app.use((0, morgan_1.default)(env_1.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
exports.app.use(express_1.default.json({ limit: '10mb' }));
exports.app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Root welcome
exports.app.get('/', (_req, res) => {
    res.json({
        name: 'VID Platform API',
        description: 'Multi-Tenant Educational Operating Ecosystem',
        version: '1.0.0',
        documentation: '/api/v1/health',
    });
});
// Versioned API Gateway
exports.app.use('/api/v1', api_v1_1.default);
// 404 Not Found Handler
exports.app.use((req, res) => {
    (0, api_response_1.sendError)(res, `Route not found: ${req.method} ${req.path}`, 404, 'NOT_FOUND');
});
// Centralized Error Handler
exports.app.use(error_middleware_1.errorMiddleware);
