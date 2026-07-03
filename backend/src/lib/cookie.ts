import { Response } from 'express';
import { env } from '../config/env';

export const AUTH_COOKIE_NAME = 'aditshoplog_token';

function cookieMaxAgeSeconds(): number {
  const expiresIn = env.jwtExpiresIn;

  if (expiresIn.endsWith('d')) {
    return parseInt(expiresIn, 10) * 86400;
  }
  if (expiresIn.endsWith('h')) {
    return parseInt(expiresIn, 10) * 3600;
  }
  if (expiresIn.endsWith('m')) {
    return parseInt(expiresIn, 10) * 60;
  }

  const seconds = parseInt(expiresIn, 10);
  return Number.isNaN(seconds) ? 604800 : seconds;
}

export function setAuthCookie(res: Response, token: string) {
  res.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: 'lax',
    path: '/',
    maxAge: cookieMaxAgeSeconds() * 1000,
  });
}

export function clearAuthCookie(res: Response) {
  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: 'lax',
    path: '/',
  });
}
