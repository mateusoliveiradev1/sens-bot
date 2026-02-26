import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { Client, ClientEvents } from 'discord.js';
import { AuditLogger } from '../utils/logger.js';
import type { ClientEvent } from '../types/index.js';

export async function loadEvents(client: Client) {
    const eventsPath = join(process.cwd(), 'src', 'events');
    AuditLogger.info('Initializing Event Handler Module...');

    try {
        const eventFiles = readdirSync(eventsPath).filter(file => file.endsWith('.ts') || file.endsWith('.js'));
        let loadedCount = 0;

        for (const file of eventFiles) {
            const filePath = `file://${join(eventsPath, file).replace(/\\/g, '/')}`;

            // Dynamic import in ESM must be heavily typed
            const module = await import(filePath);
            const event: ClientEvent<keyof ClientEvents> = module.default;

            if (event && event.name && event.execute) {
                if (event.once) {
                    client.once(event.name, (...args) => event.execute(...args));
                } else {
                    client.on(event.name, (...args) => event.execute(...args));
                }
                loadedCount++;
            } else {
                AuditLogger.error(`Failed to load event at ${file}: Missing 'name' or 'execute' property.`);
            }
        }
        AuditLogger.info(`Successfully mounted ${loadedCount} Discord Events.`);
    } catch (error: any) {
        if (error.code !== 'ENOENT') {
            AuditLogger.error('Fatal error loading events list', error?.stack);
        } else {
            AuditLogger.info('No events folder found. Creating it locally for future plugins.');
        }
    }
}
