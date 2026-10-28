import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { createClient } from 'redis';
import { createApp } from './app.js';
import { loadConfig } from './config.js';
import { createModels, initializeIndexes } from './models.js';

dotenv.config({ path: fileURLToPath(new URL('../../../.env', import.meta.url)), quiet: true });
const config = loadConfig();
const connection = mongoose.createConnection(config.mongoUri, { serverSelectionTimeoutMS: 5000 });
const redis = createClient({ url: config.redisUrl, socket: { connectTimeout: 3000, reconnectStrategy: (retries) => Math.min(1000 * (retries + 1), 5000) }, disableOfflineQueue: true });
redis.on('error', () => console.warn(JSON.stringify({ level: 'warn', event: 'redis_unavailable' })));
connection.on('error', () => console.warn(JSON.stringify({ level: 'warn', event: 'mongodb_unavailable' })));

try {
  await connection.asPromise();
  const models = createModels(connection);
  await initializeIndexes(models);
  // Redis is a dependency for upcoming workers; project CRUD remains available while it reconnects.
  void redis.connect().catch(() => console.warn(JSON.stringify({ level: 'warn', event: 'redis_connection_failed' })));
  const app = createApp({
    connection, config, models,
    redisHealth: async () => redis.isReady && await Promise.race([
      redis.ping().then((reply) => reply === 'PONG'),
      new Promise<boolean>((resolve) => { const timer = setTimeout(() => resolve(false), 1000); timer.unref(); }),
    ]),
  });
  const server = app.listen(config.port, config.host, () => console.info(JSON.stringify({ level: 'info', event: 'api_listening', host: config.host, port: config.port })));
  server.requestTimeout = 30_000;
  server.headersTimeout = 35_000;
  let shuttingDown = false;
  const shutdown = async () => {
    if (shuttingDown) return;
    shuttingDown = true;
    const forceExit = setTimeout(() => process.exit(1), 10_000);
    forceExit.unref();
    server.close(async () => {
      if (redis.isOpen) redis.destroy();
      await connection.close();
      clearTimeout(forceExit);
      process.exit(0);
    });
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
  server.on('error', () => {
    console.error(JSON.stringify({ level: 'error', event: 'api_listen_failed', hint: 'Check API_HOST/API_PORT and whether the port is already in use.' }));
    void shutdown();
  });
} catch {
  console.error(JSON.stringify({ level: 'error', event: 'startup_failed', hint: 'MongoDB must be reachable. Check MONGODB_URI and start database services.' }));
  await connection.close().catch(() => {});
  process.exitCode = 1;
}
