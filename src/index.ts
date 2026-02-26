import { Client, GatewayIntentBits, Partials } from 'discord.js';
import { env } from './config/env.js';
import { AuditLogger } from './utils/logger.js';
import { startBackupCron } from './jobs/backup.js';
import { startLeaderboardCron } from './jobs/leaderboard.js';
import { loadCommands } from './handlers/commands.js';
import { loadComponents } from './handlers/components.js';
import { loadEvents } from './handlers/events.js';

// Setup Client with extreme caching boundaries
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent, // REQUERIDO: Ler as interações de XP
        GatewayIntentBits.GuildVoiceStates, // REQUERIDO: Eventos de criar Salas Dinâmicas VIP e Squad
    ],
    partials: [Partials.User, Partials.GuildMember, Partials.Message],
});

AuditLogger.info('Sens-Bot Lifecycle Starting...');

// 1. Cron & Heartbeat Systems
startBackupCron();
import { startHeartbeat } from './jobs/heartbeat.js';
startHeartbeat();

// 2. Load Modular Caches
loadCommands().then(() => {
    return loadComponents();
}).then(() => {
    return loadEvents(client);
}).then(() => {
    // Inicia leaderboard após carregar tudo
    startLeaderboardCron(client);
});

// 3. Health Check HTTP Server for Render
import http from 'node:http';
const PORT = process.env.PORT || 3000;

http.createServer((_req, res) => {
    AuditLogger.info('Health check ping received from external monitor.');
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Sens-Bot is Active and Operational 🛡️');
}).listen(PORT, () => {
    AuditLogger.info(`Health check server listening on port ${PORT}`);
});

// Self-Ping mechanism to prevent Render sleep (Recommended to use with UptimeRobot)
if (env.RENDER_EXTERNAL_URL) {
    AuditLogger.info(`Initializing Self-Ping to ${env.RENDER_EXTERNAL_URL} (10min interval)...`);
    setInterval(() => {
        fetch(env.RENDER_EXTERNAL_URL!)
            .catch((e: any) => AuditLogger.info(`Self-Ping status: ${e?.message}`));
    }, 600000); // 10 minutos
}

// 4. Connect to Websocket
client.login(env.DISCORD_TOKEN).catch((err) => {
    AuditLogger.error('Fatal initialization error (Token invalid or network issue)', err?.message);
    process.exit(1);
});
