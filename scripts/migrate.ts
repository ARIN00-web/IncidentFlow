import 'dotenv/config';
import { Client } from 'pg';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  await client.connect();

  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const directory = join(process.cwd(), 'db', 'migrations');
  const files = (await readdir(directory))
    .filter((file) => file.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const exists = await client.query(
      'SELECT 1 FROM schema_migrations WHERE filename = $1',
      [file],
    );

    if (exists.rowCount) {
      console.log(`skip ${file}`);
      continue;
    }

    console.log(`apply ${file}`);
    const sql = await readFile(join(directory, file), 'utf8');

    await client.query('BEGIN');
    try {
      await client.query(sql);
      await client.query(
        'INSERT INTO schema_migrations(filename) VALUES ($1)',
        [file],
      );
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  }

  await client.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});