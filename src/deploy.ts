import { REST, Routes } from 'discord.js';
import { env } from './config/env.js';
import { loadCommands } from './handlers/commands.js';
import { AuditLogger } from './utils/logger.js';

const rest = new REST({ version: '10' }).setToken(env.DISCORD_TOKEN);

async function deployGlobalCommands() {
    AuditLogger.info('Started refreshing application (/) commands.');

    try {
        const commandsCache = await loadCommands();
        const payload = commandsCache.map(cmd => cmd.data.toJSON());

        // Registers globally for all servers the bot is in (takes up to 1h to sync on Discord side)
        const data: any = await rest.put(
            Routes.applicationCommands(env.CLIENT_ID),
            { body: payload },
        );

        AuditLogger.info(`Successfully reloaded ${data.length} application (/) commands globally.`);
    } catch (error: any) {
        AuditLogger.error('Failed to deploy application commands', error?.stack);
    }
}

deployGlobalCommands();
