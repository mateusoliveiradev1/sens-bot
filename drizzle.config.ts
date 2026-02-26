import { defineConfig } from 'drizzle-kit';
import { config } from 'dotenv';
import { join } from 'node:path';

config({ path: join(process.cwd(), '.env') });

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is missing in environment variables.');
}

export default defineConfig({
    schema: './src/database/schema.ts',
    out: './drizzle',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DATABASE_URL,
    },
    verbose: true,
    strict: true,
});
