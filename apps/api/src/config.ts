import { z } from 'zod';

const booleanString = z.enum(['true', 'false']).transform((value) => value === 'true');

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  API_HOST: z.string().min(1).default('127.0.0.1'),
  APP_ORIGIN: z.url().default('http://localhost:5173'),
  MONGODB_URI: z.string().regex(/^mongodb(?:\+srv)?:\/\//).default('mongodb://127.0.0.1:27017/creatorflow'),
  REDIS_URL: z.string().regex(/^rediss?:\/\//).default('redis://127.0.0.1:6379'),
  SESSION_TTL_HOURS: z.coerce.number().int().min(1).max(720).default(24),
  COOKIE_SECURE: booleanString.optional(),
  TRUST_PROXY: z.enum(['false', '1']).default('false'),
});

export function loadConfig(environment: NodeJS.ProcessEnv = process.env) {
  const parsed = environmentSchema.safeParse(environment);
  if (!parsed.success) {
    // Report names only. Connection URLs may contain passwords.
    throw new Error(`Invalid environment variables: ${parsed.error.issues.map((issue) => issue.path.join('.')).join(', ')}`);
  }
  const value = parsed.data;
  return {
    nodeEnv: value.NODE_ENV,
    port: value.API_PORT,
    host: value.API_HOST,
    appOrigin: new URL(value.APP_ORIGIN).origin,
    mongoUri: value.MONGODB_URI,
    redisUrl: value.REDIS_URL,
    sessionTtlHours: value.SESSION_TTL_HOURS,
    cookieSecure: value.COOKIE_SECURE ?? value.NODE_ENV === 'production',
    trustProxy: value.TRUST_PROXY === '1' ? 1 as const : false as const,
  };
}

export type AppConfig = ReturnType<typeof loadConfig>;
