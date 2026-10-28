import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { ApiError } from './errors.js';
import type { Models } from './models.js';
import type { AppConfig } from './config.js';
import type { RequestHandler, Response } from 'express';

const SCRYPT_OPTIONS = { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const COOKIE_NAME = 'creatorflow_session';
const SESSION_PATTERN = /^[a-f0-9]{64}$/;

function derive(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, 64, SCRYPT_OPTIONS, (error, key) => error ? reject(error) : resolve(key));
  });
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  return `scrypt:${salt}:${(await derive(password, salt)).toString('hex')}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [algorithm, salt, hash] = stored.split(':');
  if (algorithm !== 'scrypt' || !salt || !hash || !/^[a-f0-9]{128}$/.test(hash)) return false;
  const computed = await derive(password, salt);
  return timingSafeEqual(computed, Buffer.from(hash, 'hex'));
}

export function tokenHash(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export function cookieOptions(config: AppConfig) {
  return { httpOnly: true, secure: config.cookieSecure, sameSite: 'lax' as const, path: '/' };
}

export async function issueSession(models: Models, config: AppConfig, response: Response, ownerId: string, previousToken?: unknown) {
  const token = randomBytes(32).toString('hex');
  const csrfToken = randomBytes(32).toString('hex');
  const ttl = config.sessionTtlHours * 60 * 60 * 1000;
  await models.Session.create({ tokenHash: tokenHash(token), ownerId, csrfToken, expiresAt: new Date(Date.now() + ttl) });
  if (typeof previousToken === 'string' && SESSION_PATTERN.test(previousToken)) {
    await models.Session.deleteOne({ tokenHash: tokenHash(previousToken) });
  }
  response.cookie(COOKIE_NAME, token, { ...cookieOptions(config), maxAge: ttl });
  return csrfToken;
}

export interface AuthContext {
  ownerId: string;
  tokenHash: string;
  csrfToken: string;
}

declare global {
  namespace Express {
    interface Request { auth?: AuthContext }
  }
}

export function requireAuth(models: Models): RequestHandler {
  return async (request, _response, next) => {
    const token = request.cookies?.[COOKIE_NAME] as unknown;
    if (typeof token !== 'string' || !SESSION_PATTERN.test(token)) throw new ApiError(401, 'UNAUTHENTICATED', 'Sign in to continue.');
    const hash = tokenHash(token);
    const session = await models.Session.findOne({ tokenHash: hash, expiresAt: { $gt: new Date() } }).lean();
    if (!session) throw new ApiError(401, 'UNAUTHENTICATED', 'Your session has expired. Sign in again.');
    request.auth = { ownerId: session.ownerId.toString(), tokenHash: hash, csrfToken: session.csrfToken };
    next();
  };
}

export function enforceOrigin(config: AppConfig): RequestHandler {
  return (request, _response, next) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
      const origin = request.get('origin');
      if (origin && origin !== config.appOrigin) throw new ApiError(403, 'ORIGIN_REJECTED', 'This request origin is not allowed.');
      const fetchSite = request.get('sec-fetch-site');
      if (fetchSite === 'cross-site') throw new ApiError(403, 'ORIGIN_REJECTED', 'Cross-site requests are not allowed.');
    }
    next();
  };
}

export const requireCsrf: RequestHandler = (request, _response, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
    const supplied = request.get('x-csrf-token');
    const expected = request.auth?.csrfToken;
    if (!supplied || !expected || !SESSION_PATTERN.test(supplied) || !timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))) {
      throw new ApiError(403, 'CSRF_REJECTED', 'Session verification failed. Refresh and try again.');
    }
  }
  next();
};

export function clearSessionCookie(config: AppConfig, response: Response) {
  response.clearCookie(COOKIE_NAME, cookieOptions(config));
}
