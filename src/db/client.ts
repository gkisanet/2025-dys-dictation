import { SQLocalDrizzle } from 'sqlocal/drizzle';
import { drizzle } from 'drizzle-orm/sqlite-proxy';
import * as schema from './schema';

type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>;

let dbPromise: Promise<DrizzleDb> | null = null;

export function getDb(): Promise<DrizzleDb> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const client = new SQLocalDrizzle('mental-math.sqlite3');
      await client.sql`CREATE TABLE IF NOT EXISTS attempts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        stage_id TEXT NOT NULL,
        operation TEXT NOT NULL,
        operand_a INTEGER NOT NULL,
        operand_b INTEGER NOT NULL,
        quiz_correct INTEGER NOT NULL,
        quiz_total INTEGER NOT NULL,
        created_at INTEGER NOT NULL
      )`;
      return drizzle(client.driver, client.batchDriver, { schema });
    })();
  }
  return dbPromise;
}
