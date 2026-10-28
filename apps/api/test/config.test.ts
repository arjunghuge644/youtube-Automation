import { describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config.js';
import { hashPassword, verifyPassword } from '../src/security.js';

describe('configuration and credential security', () => {
  it('defaults to loopback development and secure cookies in production', () => {
    expect(loadConfig({})).toMatchObject({ host: '127.0.0.1', port: 4000, cookieSecure: false });
    expect(loadConfig({ NODE_ENV: 'production' }).cookieSecure).toBe(true);
    expect(loadConfig({ NODE_ENV: 'production', COOKIE_SECURE: 'false' }).cookieSecure).toBe(false);
  });
  it('rejects unsafe configuration without printing its contents', () => {
    expect(() => loadConfig({ API_PORT: '0' })).toThrow('API_PORT');
    expect(() => loadConfig({ TRUST_PROXY: 'true' })).toThrow('TRUST_PROXY');
    expect(() => loadConfig({ MONGODB_URI: 'password-containing-invalid-uri' })).not.toThrow('password-containing-invalid-uri');
    expect(() => loadConfig({ COOKIE_SECURE: 'yes' })).toThrow('COOKIE_SECURE');
  });
  it('salts independently and verifies passwords without plaintext storage', async () => {
    const first = await hashPassword('Strong test password');
    const second = await hashPassword('Strong test password');
    expect(first).not.toBe(second);
    expect(await verifyPassword('Strong test password', first)).toBe(true);
    expect(await verifyPassword('Different password', first)).toBe(false);
    expect(await verifyPassword('Strong test password', 'invalid')).toBe(false);
  });
});
