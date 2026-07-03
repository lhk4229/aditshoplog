import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

function requireEnv(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

const DEFAULT_DEV_ORIGINS = ['http://localhost:3000', 'http://localhost:3001'];

function parseCorsOrigins(): string[] {
  const configured = (process.env.CORS_ORIGIN ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  return Array.from(new Set([...configured, ...DEFAULT_DEV_ORIGINS]));
}

function parseCookieSecure(): boolean {
  const override = process.env.COOKIE_SECURE?.trim().toLowerCase();
  if (override === 'true') return true;
  if (override === 'false') return false;
  const publicUrl = (process.env.APP_URL ?? process.env.CORS_ORIGIN ?? '').trim();
  return publicUrl.startsWith('https://');
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: requireEnv(
    'DATABASE_URL',
    'postgresql://aditshoplog:aditshoplog@localhost:5432/aditshoplog'
  ),
  jwtSecret: requireEnv('JWT_SECRET', 'dev-secret-change-in-production'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  corsOrigin: parseCorsOrigins(),
  cookieSecure: parseCookieSecure(),
  nodeEnv: process.env.NODE_ENV ?? 'development',
};
