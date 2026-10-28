import { defineConfig } from 'vitest/config';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

if (!process.env.MONGOMS_SYSTEM_BINARY) {
  const candidates = [
    path.join(os.homedir(), '.cache', 'mongodb-binaries'),
    path.join(process.cwd(), '.cache', 'mongodb'),
    path.join(process.cwd(), '.cache', 'mongodb-binaries'),
  ];
  for (const dir of candidates) {
    if (fs.existsSync(dir)) {
      const binaries = fs.readdirSync(dir).filter((file) => file.startsWith('mongod') && !file.endsWith('.md5'));
      if (binaries.length > 0) {
        process.env.MONGOMS_SYSTEM_BINARY = path.join(dir, binaries[0]);
        break;
      }
    }
  }
}

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts', 'apps/*/src/**/*.test.{ts,tsx}', 'apps/*/test/**/*.test.ts', 'apps/*/tests/**/*.test.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**', 'tests/e2e/**'],
    environmentMatchGlobs: [
      ['apps/web/**', 'jsdom'],
    ],
    setupFiles: ['./apps/web/src/test/setup.ts'],
    testTimeout: 30_000,
    hookTimeout: 120_000,
    fileParallelism: false,
    restoreMocks: true,
  },
});
