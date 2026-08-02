import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

export const db = drizzle({
  connection: {
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 60e3,
    query_timeout: 60e3,
    // Recycle idle connections client-side instead of leaving them for the
    // server to reap.
    idleTimeoutMillis: 30e3,
    keepAlive: true
  },
  schema
});

// A pooled connection that the server kills while it sits idle (failover,
// maintenance, pg_terminate_backend) is re-emitted by pg-pool as an 'error' on
// the pool. 'error' is the one EventEmitter event that throws when nobody is
// listening, so with no handler here the process dies on uncaughtException.
// pg-pool has already removed the dead client by this point and the next query
// opens a fresh one, so logging and carrying on is the correct response.
db.$client.on('error', err => console.log('[db] pool error', err));

export async function runMigrations() {
  await migrate(db, { migrationsFolder: 'drizzle' });
}
