import { db } from './src/database/index.js';
import { sql } from 'drizzle-orm';

async function check() {
    try {
        const { users } = await import('./src/database/schema.js');
        const { eq } = await import('drizzle-orm');

        console.log("Attempting to query user 343264130905669632...");
        const result = await db.select().from(users).where(eq(users.id, '343264130905669632')).limit(1);
        console.log("Query Success! Result:", JSON.stringify(result, null, 2));
    } catch (err: any) {
        console.error("Query Failed!", err?.message);
    } finally {
        process.exit(0);
    }
}

check();
