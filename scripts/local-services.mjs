// Development only: real MongoDB + Redis, persistent project data, loopback binding.
import { spawn, spawnSync } from 'node:child_process';
import { mkdir, access, open } from 'node:fs/promises';
import { constants, existsSync, readdirSync } from 'node:fs';
import os from 'node:os';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MongoMemoryServer } from 'mongodb-memory-server';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(root);

if (!process.env.MONGOMS_SYSTEM_BINARY) {
  const candidates = [
    path.join(os.homedir(), '.cache', 'mongodb-binaries'),
    path.join(root, '.cache', 'mongodb'),
    path.join(root, '.cache', 'mongodb-binaries'),
  ];
  for (const dir of candidates) {
    if (existsSync(dir)) {
      const binaries = readdirSync(dir).filter((file) => file.startsWith('mongod') && !file.endsWith('.md5'));
      if (binaries.length > 0) {
        process.env.MONGOMS_SYSTEM_BINARY = path.join(dir, binaries[0]);
        break;
      }
    }
  }
}
const local = path.join(root, '.local');
const port = (value, fallback) => {
  const number = Number(value || fallback);
  if (!Number.isInteger(number) || number < 1024 || number > 65535) throw new Error('Local service ports must be integers between 1024 and 65535.');
  return number;
};
const mongoPort = port(process.env.LOCAL_MONGO_PORT, 27017);
const redisPort = port(process.env.LOCAL_REDIS_PORT, 6379);
let mongo;
let redis;
let log;
let stopping = false;

async function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  if (redis && redis.exitCode === null) {
    const exited = new Promise((resolve) => redis.once('exit', resolve));
    redis.kill('SIGTERM');
    const timeout = setTimeout(() => redis.kill('SIGKILL'), 5000);
    await exited;
    clearTimeout(timeout);
  }
  if (mongo) await mongo.stop({ doCleanup: false, force: false });
  if (log) await log.close();
  console.log('Local services stopped. Data remains in .local/.');
  process.exitCode = code;
}

async function ensureFree(portNumber) {
  await new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', () => reject(new Error(`Port ${portNumber} is occupied; use your existing service or choose LOCAL_MONGO_PORT / LOCAL_REDIS_PORT.`)));
    server.listen(portNumber, '127.0.0.1', () => server.close(resolve));
  });
}

async function redisPing() {
  return new Promise((resolve) => {
    const socket = net.connect(redisPort, '127.0.0.1');
    socket.setTimeout(500);
    socket.on('connect', () => socket.write('*1\r\n$4\r\nPING\r\n'));
    socket.on('data', (data) => { resolve(data.toString().includes('+PONG')); socket.destroy(); });
    socket.on('error', () => resolve(false));
    socket.on('timeout', () => { socket.destroy(); resolve(false); });
  });
}

try {
  let redisBinary = process.env.REDIS_BINARY;
  if (!redisBinary) {
    const localBinary = path.join(local, 'bin', 'redis-server');
    try { await access(localBinary, constants.X_OK); redisBinary = localBinary; } catch { redisBinary = 'redis-server'; }
  }
  const available = spawnSync(redisBinary, ['--version'], { encoding: 'utf8', timeout: 5000 });
  if (available.error || available.status !== 0) {
    throw new Error('Redis is missing. On Ubuntu install redis-server, or set REDIS_BINARY to a trusted redis-server executable. See README.md.');
  }
  await ensureFree(mongoPort);
  await ensureFree(redisPort);
  await mkdir(path.join(local, 'mongo'), { recursive: true });
  await mkdir(path.join(local, 'redis'), { recursive: true });
  console.log('Starting real local databases. First MongoDB start may download its official binary.');
  mongo = await MongoMemoryServer.create({
    instance: { dbPath: path.join(local, 'mongo'), port: mongoPort, ip: '127.0.0.1', storageEngine: 'wiredTiger' },
  });
  log = await open(path.join(local, 'redis.log'), 'a');
  redis = spawn(redisBinary, ['--bind', '127.0.0.1', '--port', String(redisPort), '--protected-mode', 'yes', '--appendonly', 'yes', '--dir', path.join(local, 'redis')], { stdio: ['ignore', log.fd, log.fd] });
  redis.on('error', (error) => { console.error(`Redis failed: ${error.message}`); void stop(1); });
  redis.on('exit', () => { if (!stopping) { console.error('Redis exited unexpectedly; see .local/redis.log.'); void stop(1); } });
  let healthy = false;
  for (let attempt = 0; attempt < 50; attempt++) {
    if (await redisPing()) { healthy = true; break; }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  if (!healthy) throw new Error('Redis did not become ready; see .local/redis.log.');
  console.log(`MongoDB: mongodb://127.0.0.1:${mongoPort}/creatorflow`);
  console.log(`Redis: redis://127.0.0.1:${redisPort}`);
  console.log('Development only; no database authentication. Press Ctrl+C to stop.');
  process.once('SIGINT', () => void stop());
  process.once('SIGTERM', () => void stop());
} catch (error) {
  console.error(error.message);
  await stop(1);
}
