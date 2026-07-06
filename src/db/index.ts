import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;

let db: ReturnType<typeof drizzle> | null = null;

if (connectionString && (connectionString.startsWith('postgres://') || connectionString.startsWith('postgresql://'))) {
  try {
    const client = postgres(connectionString, { prepare: false });
    db = drizzle(client, { schema });
  } catch (e) {
    console.error("Failed to initialize database:", e);
  }
} else if (connectionString) {
  console.warn("DATABASE_URL is not a valid PostgreSQL connection string. Ensure it starts with postgres:// or postgresql://");
}

export { db };
