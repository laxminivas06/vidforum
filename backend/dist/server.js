"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const env_1 = require("./config/env");
const database_1 = require("./config/database");
async function bootstrap() {
    console.log(' Starting VID Platform Backend Server...');
    // Test Supabase PostgreSQL connection
    const dbConnected = await database_1.db.testConnection();
    if (!dbConnected) {
        console.error(' Database connectivity check failed. Check Supabase credentials.');
    }
    const server = app_1.app.listen(env_1.env.PORT, () => {
        console.log(` VID Platform Backend is running on http://localhost:${env_1.env.PORT}`);
        console.log(` Health check available at: http://localhost:${env_1.env.PORT}/api/v1/health`);
        console.log(` Multi-tenant database connected to: ${env_1.env.DB_HOST}:${env_1.env.DB_PORT}/${env_1.env.DB_NAME}`);
    });
    // Graceful shutdown
    const shutdown = async (signal) => {
        console.log(` Received ${signal}. Gracefully shutting down...`);
        server.close(async () => {
            console.log(' HTTP server closed.');
            await database_1.pool.end();
            console.log(' PostgreSQL connection pool drained.');
            process.exit(0);
        });
    };
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
}
bootstrap().catch((err) => {
    console.error(' Fatal bootstrap failure:', err);
    process.exit(1);
});
