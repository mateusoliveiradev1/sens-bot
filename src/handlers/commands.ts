import { readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Collection } from 'discord.js';
import { AuditLogger } from '../utils/logger.js';
import type { Command } from '../types/index.js';

// Global memory cache for loaded commands
export const commandsCache = new Collection<string, Command>();

export async function loadCommands() {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const commandsPath = join(__dirname, '..', 'commands');
    AuditLogger.info(`Initializing Slash Command Loader at: ${commandsPath}`);
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
                    // Windows fix: pathname might start with /C:
                    const fileUrl = `file://${fullPath}`;
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
