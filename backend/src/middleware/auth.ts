import { Request, Response, NextFunction } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { AUTH_COOKIE_NAME } from '../lib/cookie';
import { AppError } from './errorHandler';
import { query } from '../db/pool';

export interface AuthPayload {
  userId: number;
  email: string;
  name: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

function extractToken(req: Request): string | null {
  const cookieToken = req.cookies?.[AUTH_COOKIE_NAME];
  if (typeof cookieToken === 'string' && cookieToken.length > 0) {
    return cookieToken;
  }

  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    return header.slice(7);
  }

  return null;
}

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  const token = extractToken(req);

  if (!token) {
    return next(new AppError(401, '로그인이 필요합니다.'));
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret) as AuthPayload;

    const result = await query<{ id: number; email_verified_at: Date | null }>(
      'SELECT id, email_verified_at FROM users WHERE id = $1',
      [payload.userId]
    );
    if (result.rows.length === 0 || !result.rows[0].email_verified_at) {
      return next(new AppError(401, '유효하지 않거나 만료된 토큰입니다.'));
    }

    req.user = payload;
    next();
  } catch {
    next(new AppError(401, '유효하지 않거나 만료된 토큰입니다.'));
  }
}

export function signToken(payload: AuthPayload): string {
  const options: SignOptions = { expiresIn: env.jwtExpiresIn as SignOptions['expiresIn'] };
  return jwt.sign(payload, env.jwtSecret, options);
}
