import { z } from 'zod';
import { config } from 'dotenv';
import { join } from 'node:path';

// Load .env relative to the project root
config({ path: join(process.cwd(), '.env') });

const envSchema = z.object({
    DISCORD_TOKEN: z.string().min(1, 'Discord token is required'),
    CLIENT_ID: z.string().min(1, 'Discord Client ID is required'),
    DATABASE_URL: z.string().url('A valid Neon DB URL is required'),
    BOT_API_KEY: z.string().min(1, 'BOT_API_KEY is required for Secure Site Integration'),
    NODE_ENV: z.enum(['development', 'production']).default('development'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
    console.error(
        '❌ Invalid environment variables:\n',
        ...parsedEnv.error.issues.map((issue) => `- ${issue.path.join('.')}: ${issue.message}\n`),
    );
    process.exit(1);
}

export const env = parsedEnv.data;
