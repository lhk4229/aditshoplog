import { Pool, QueryResultRow, types } from 'pg';
import { env } from '../config/env';

// DATE 컬럼을 Date 객체 대신 'YYYY-MM-DD' 문자열로 반환 (타임존 하루 밀림 방지)
types.setTypeParser(1082, (value) => value);

export const pool = new Pool({
  connectionString: env.databaseUrl,
  options: '-c timezone=Asia/Seoul',
});

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
) {
  return pool.query<T>(text, params);
}
