import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { Collection } from 'discord.js';
import { AuditLogger } from '../utils/logger.js';
import type { Command } from '../types/index.js';

// Global memory cache for loaded commands
export const commandsCache = new Collection<string, Command>();

export async function loadCommands() {
    const commandsPath = join(process.cwd(), 'src', 'commands');
    AuditLogger.info('Initializing Slash Command Loader...');
    let loadedCount = 0;

    async function loadDirectory(dir: string) {
        try {
            const files = readdirSync(dir);
            for (const file of files) {
                const fullPath = join(dir, file);
                if (statSync(fullPath).isDirectory()) {
                    // Recursive sub-folder loading
                    await loadDirectory(fullPath);
                } else if (file.endsWith('.ts') || file.endsWith('.js')) {
                    const fileUrl = `file://${fullPath.replace(/\\/g, '/')}`;
                    const module = await import(fileUrl);
                    const command: Command = module.default;

                    if (command && typeof command.data === 'object' && typeof command.execute === 'function') {
                        commandsCache.set(command.data.name, command);
                        loadedCount++;
                    } else {
                        AuditLogger.error(`Invalid command structure at ${fullPath}. Missing 'data' or 'execute'.`);
                    }
                }
            }
        } catch (error: any) {
            if (error.code !== 'ENOENT') {
                AuditLogger.error('Failed scanning command folder', error?.message);
            } else {
                AuditLogger.info(`No directory at ${dir}. Creating for future plugins.`);
            }
        }
    }

    await loadDirectory(commandsPath);
    AuditLogger.info(`Successfully cached ${loadedCount} Application Commands.`);
    return commandsCache;
}
