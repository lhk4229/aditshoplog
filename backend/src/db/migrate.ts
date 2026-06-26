import fs from 'fs';
import path from 'path';
import { pool } from './pool';

async function migrate() {
  const migrationsDir = path.resolve(__dirname, '../../migrations');
  const files = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) UNIQUE NOT NULL,
      applied_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  for (const file of files) {
    const { rows } = await pool.query(
      'SELECT 1 FROM schema_migrations WHERE filename = $1',
      [file]
    );

    if (rows.length > 0) {
      console.log(`Skip: ${file}`);
      continue;
    }

    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query(
        'INSERT INTO schema_migrations (filename) VALUES ($1)',
        [file]
      );
      await client.query('COMMIT');
      console.log(`Applied: ${file}`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  console.log('Migration complete.');
  await pool.end();
}

migrate().catch((error) => {
  const code = (error as NodeJS.ErrnoException).code;
  if (code === 'ECONNREFUSED') {
    console.error('Migration failed: PostgreSQL에 연결할 수 없습니다 (ECONNREFUSED).');
    console.error('');
    console.error('다음 순서로 DB를 먼저 기동해 주세요:');
    console.error('  1. Docker Desktop 실행');
    console.error('  2. npm run db:up');
    console.error('  3. npm run db:migrate');
    console.error('');
    console.error('Docker 없이 사용하려면 PostgreSQL을 로컬에 설치하고 .env의 DATABASE_URL을 맞춰 주세요.');
  } else {
    console.error('Migration failed:', error);
  }
  process.exit(1);
});
