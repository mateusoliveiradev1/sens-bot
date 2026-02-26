import { Events, ActivityType } from 'discord.js';
import type { ClientEvent } from '../types/index.js';
import { AuditLogger } from '../utils/logger.js';
import { db } from '../database/index.js';
import { serverConfigs } from '../database/schema.js';

const readyEvent: ClientEvent<Events.ClientReady> = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        // 1. Attach client to the Logger so it can send embeds to Audit Channels
        AuditLogger.initialize(client);

        // 2. Report Bootup
        AuditLogger.info(`[ONLINE] Logged in successfully as ${client.user.tag} (${client.user.id})`);

        // 3. Ping the database via Drizzle to ensure Neon connection is warm
        try {
            AuditLogger.info('Verifying Neon Database Pool connection...');
            await db.execute('SELECT 1');
            AuditLogger.info('✅ Neon Database Active and Queryable.');

            // 4. Load configured Audit Channels from DB
            const configs = await db.select().from(serverConfigs).limit(1);
            if (configs.length > 0 && configs[0]) {
                AuditLogger.initialize(client, configs[0].auditChannelId || undefined, configs[0].backupsChannelId || undefined);
                AuditLogger.info('Loaded server configuration paths from Neon DB.');
            }
        } catch (err: any) {
            AuditLogger.error('❌ Database warm-up failed on bootup.', err?.message);
        }

        // 5. Vigilante de Roles: Blindagem do Cargo Master no Owner do Servidor
        for (const guild of client.guilds.cache.values()) {
            try {
                // Força o cache do dono da Guilda
                const owner = await guild.members.fetch(guild.ownerId);
                const adminRole = guild.roles.cache.find(r => r.name === '👑 SENS | ADMINISTRADOR');

                if (adminRole && !owner.roles.cache.has(adminRole.id)) {
                    await owner.roles.add(adminRole);
                    AuditLogger.systemEvent('🛡️ Blindagem de Owner', `O cargo Supremo Master ['👑 SENS | ADMINISTRADOR'] foi reatribuído compulsoriamente ao verdadeiro dono do servidor (${owner.user.tag}) garantindo controle absoluto.`);
                }

                // 6. Sincronização Base de Dados - Garante que o Owner existe na Tabela Master 'users'
                const { users } = await import('../database/schema.js');
                const { eq } = await import('drizzle-orm');
                const existingUser = await db.select().from(users).where(eq(users.id, owner.id)).limit(1);
                if (existingUser.length === 0) {
                    await db.insert(users).values({
                        id: owner.id,
                        username: owner.user.username,
                        joinedAt: owner.joinedAt || new Date()
                    });
                    AuditLogger.info(`Owner ${owner.user.tag} sincronizado com a tabela Master 'users'.`);
                }

            } catch (e: any) {
                AuditLogger.error(`Falha ao proteger Owner da Guilda ${guild.name}`, e?.message);
            }
        }

        // 7. Ligar a Máquina Autônoma de Sorteios Inteligentes
        const { startGiveawayEngine } = await import('../utils/giveaway-engine.js');
        startGiveawayEngine(client);

        // 8. Visual Presence: Bot looking sharp for launch
        client.user?.setPresence({
            activities: [{ name: 'sens-pubg.com', type: ActivityType.Watching }],
            status: 'online',
        });
    },
};

export default readyEvent;
