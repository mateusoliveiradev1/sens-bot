import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { env } from '../config/env.js';
import * as schema from './schema.js';

// Connection client for Neon over HTTP (Lower latency for connectionless serverless architectures)
const sql = neon(env.DATABASE_URL);

// Export the Type-Safe Database client
export const db = drizzle(sql, { schema });
