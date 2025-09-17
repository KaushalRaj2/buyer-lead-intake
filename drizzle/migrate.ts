// drizzle/migrate.ts
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const runMigrations = async () => {
  const client = postgres(process.env.DATABASE_URL!, { max: 1 });
  const db = drizzle(client);

  console.log('Running migrations...');
  
  await migrate(db, { migrationsFolder: './drizzle/migrations' });
  
  console.log('Migrations completed!');
  
  await client.end();
};

runMigrations().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
