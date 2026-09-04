import crypto from 'crypto';
import { query } from '../db/pool';

export type TokenPurpose = 'verify_email' | 'reset_password';

const TOKEN_TTL_MS = 30 * 60 * 1000;

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function issueEmailToken(
  userId: number,
  purpose: TokenPurpose
): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(token);

  await query(
    `UPDATE email_tokens
     SET used_at = NOW()
     WHERE user_id = $1 AND purpose = $2 AND used_at IS NULL`,
    [userId, purpose]
  );

  await query(
    `INSERT INTO email_tokens (user_id, purpose, token_hash, expires_at)
     VALUES ($1, $2, $3, $4)`,
    [userId, purpose, tokenHash, new Date(Date.now() + TOKEN_TTL_MS)]
  );

  return token;
}

export async function consumeEmailToken(
  token: string,
  purpose: TokenPurpose
): Promise<number | null> {
  const tokenHash = hashToken(token);
  const result = await query<{ id: number; user_id: number }>(
    `SELECT id, user_id FROM email_tokens
     WHERE token_hash = $1 AND purpose = $2 AND used_at IS NULL AND expires_at > NOW()`,
    [tokenHash, purpose]
  );

  const row = result.rows[0];
  if (!row) {
    return null;
  }

  await query('UPDATE email_tokens SET used_at = NOW() WHERE id = $1', [row.id]);
  return row.user_id;
}
