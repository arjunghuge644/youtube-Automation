import { spawnSync } from 'node:child_process';

const tools = [
  ['Node.js', 'node', ['--version'], true],
  ['npm', 'npm', ['--version'], true],
  ['Python (later phases)', 'python3', ['--version'], false],
  ['Docker', 'docker', ['--version'], false],
  ['MongoDB', 'mongod', ['--version'], false],
  ['Redis', process.env.REDIS_BINARY || 'redis-server', ['--version'], false],
  ['FFmpeg (later phases)', 'ffmpeg', ['-version'], false],
];
let missing = false;
for (const [name, command, args, required] of tools) {
  const result = spawnSync(command, args, { encoding: 'utf8', timeout: 10_000 });
  const available = !result.error && result.status === 0;
  console.log(`${available ? 'OK' : required ? 'MISSING' : 'OPTIONAL'} ${name}: ${available ? result.stdout.split('\n')[0] : 'not installed'}`);
  if (required && !available) missing = true;
}
console.log('Use Docker Compose or npm run services:local for development MongoDB/Redis. See README.md.');
process.exitCode = missing ? 1 : 0;
