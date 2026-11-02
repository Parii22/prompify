import app from './app.js';
import { envConfig } from './config/env.config.js';

const PORT = envConfig.port;

const server = app.listen(PORT, () => {
  console.log(`[Server] Prompify Backend running on http://localhost:${PORT}`);
  console.log(`[Server] Environment: ${envConfig.nodeEnv}`);
  console.log(`[Server] Health check: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown handling
const shutdown = () => {
  console.log('[Server] Gracefully shutting down...');
  server.close(() => {
    console.log('[Server] Closed all connections. Process exiting.');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
