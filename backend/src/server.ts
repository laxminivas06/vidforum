import { app } from './app';
import { env } from './config/env';
import { db, pool } from './config/database';

import { WebSocketServer } from 'ws';
import { voiceSessionManager } from './modules/ai-yantra/voice-agent.service';
import { campaignWorkerService } from './modules/ai-yantra/campaign-worker.service';
import { initializeCampaignQueue } from './modules/ai-yantra/queue/campaignQueue';

async function bootstrap() {
  console.log(' Starting VID Platform Backend Server...');

  // Test Supabase PostgreSQL connection
  const dbConnected = await db.testConnection();
  if (!dbConnected) {
    console.error(' Database connectivity check failed. Check Supabase credentials.');
  } else {
    campaignWorkerService.resumeRunningCampaigns().catch((err) => {
      console.error('[CAMPAIGN WORKER] Startup resume error:', err.message);
    });
    initializeCampaignQueue().catch((err) => {
      console.warn('[CAMPAIGN QUEUE] Startup notice:', err.message);
    });
  }

  const server = app.listen(env.PORT, () => {
    console.log(` VID Platform Backend is running on http://localhost:${env.PORT}`);
    console.log(` Health check available at: http://localhost:${env.PORT}/api/v1/health`);
    console.log(` Multi-tenant database connected to: ${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}`);
  });

  // Attach Telephony Live Stream WebSocket Server
  const wss = new WebSocketServer({ server });
  wss.on('connection', (ws, req) => {
    const pathname = req.url ? new URL(req.url, 'http://localhost').pathname : '';
    if (pathname.includes('/voice/stream')) {
      console.log(`[WS] Inbound telephony stream attached on ${pathname}`);
      voiceSessionManager.handleConnection(ws);
    } else {
      ws.close(1008, 'Unsupported WebSocket route');
    }
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(` Received ${signal}. Gracefully shutting down...`);
    server.close(async () => {
      console.log(' HTTP server closed.');
      await pool.end();
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
