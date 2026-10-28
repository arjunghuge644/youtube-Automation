import type { ErrorRequestHandler } from 'express';
import { randomUUID } from 'node:crypto';

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public details?: unknown) {
    super(message);
  }
}

export const errorHandler: ErrorRequestHandler = (error: unknown, _request, response, _next) => {
  if (error instanceof ApiError) {
    response.status(error.status).json({ error: { code: error.code, message: error.message, ...(error.details ? { details: error.details } : {}) } });
    return;
  }
  if (error && typeof error === 'object' && 'type' in error && error.type === 'entity.too.large') {
    response.status(413).json({ error: { code: 'BODY_TOO_LARGE', message: 'Request body exceeds the 32 KB limit.' } });
    return;
  }
  if (error instanceof SyntaxError && 'body' in error) {
    response.status(400).json({ error: { code: 'INVALID_JSON', message: 'Request body must contain valid JSON.' } });
    return;
  }
  if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
    response.status(409).json({ error: { code: 'CONFLICT', message: 'This record already exists.' } });
    return;
  }
  const incidentId = randomUUID();
  // Never log request bodies, session cookies, connection URLs, or provider credentials.
  console.error(JSON.stringify({ level: 'error', event: 'request_failed', incidentId, errorType: error instanceof Error ? error.name : 'UnknownError' }));
  response.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.', incidentId } });
};
