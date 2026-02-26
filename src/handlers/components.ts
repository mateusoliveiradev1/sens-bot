import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { Collection } from 'discord.js';
import { AuditLogger } from '../utils/logger.js';
import type { ComponentHandler } from '../types/index.js';

// Cache for standard Discord components (Buttons, Modals, Selects)
export const componentsCache = new Collection<string, ComponentHandler<any>>();

export async function loadComponents() {
    const __dirname = new URL('.', import.meta.url).pathname;
    const componentsPath = join(__dirname, '..', 'components');
    AuditLogger.info('Initializing Component Handler Loader...');
    let loadedCount = 0;

    async function loadDirectory(dir: string) {
        try {
            const files = readdirSync(dir);
            for (const file of files) {
                const fullPath = join(dir, file);
                if (statSync(fullPath).isDirectory()) {
                    await loadDirectory(fullPath);
                } else if (file.endsWith('.ts') || file.endsWith('.js')) {
                    const fileUrl = `file://${fullPath}`;
                    const module = await import(fileUrl);
                    const component: ComponentHandler<any> = module.default;

                    if (component && typeof component.id === 'string' && typeof component.execute === 'function') {
                        componentsCache.set(component.id, component);
                        loadedCount++;
                    } else {
                        AuditLogger.error(`Invalid Component at ${fullPath}. Missing 'id' or 'execute'.`);
                    }
                }
            }
        } catch (error: any) {
            if (error.code !== 'ENOENT') {
                AuditLogger.error('Failed scanning components folder', error?.message);
            } else {
                AuditLogger.info(`No directory at ${dir}. Creating for future plugins.`);
            }
        }
    }

    await loadDirectory(componentsPath);
    AuditLogger.info(`Successfully cached ${loadedCount} UI Components.`);
}
