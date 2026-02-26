import cron from 'node-cron';
import { Client, TextChannel, EmbedBuilder } from 'discord.js';
import { db } from '../database/index.js';
import { userXp, leaderboardConfigs } from '../database/schema.js';
import { desc } from 'drizzle-orm';
import { AuditLogger } from '../utils/logger.js';

export function startLeaderboardCron(client: Client) {
    // Roda a cada 10 minutos
    cron.schedule('*/10 * * * *', async () => {
        AuditLogger.info('Leaderboard Auto-Sync: Commencing top 10 refresh...');

        try {
            const configs = await db.select().from(leaderboardConfigs);

            for (const config of configs) {
                const guild = client.guilds.cache.get(config.guildId);
                if (!guild) continue;

                const channel = guild.channels.cache.get(config.channelId) as TextChannel;
                if (!channel) continue;

                const topUsers = await db.select()
                    .from(userXp)
                    .orderBy(desc(userXp.xp))
                    .limit(10);

                const embed = new EmbedBuilder()
                    .setTitle('🏆 HALL DA FAMA: TOP 10 SENS-PUBG')
                    .setColor(0x9333ea)
                    .setThumbnail('https://cdn-icons-png.flaticon.com/512/3112/3112946.png')
                    .setDescription('Este painel é atualizado automaticamente a cada 10 minutos. Ganhe XP em sorteios e eventos para subir no ranking!')
                    .setTimestamp()
                    .setFooter({ text: 'Sincronizado com Neon Database' });

                if (topUsers.length === 0) {
                    embed.addFields({ name: 'Vazio', value: 'Nenhum usuário no ranking ainda.' });
                } else {
                    let leaderboardText = '';
                    for (let i = 0; i < topUsers.length; i++) {
                        const score = topUsers[i];
                        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '👤';
                        leaderboardText += `${medal} **#${i + 1}** | <@${score.userId}> \n> Nível: \`${score.level}\` • XP: \`${score.xp.toLocaleString()}\`\n\n`;
                    }
                    embed.setDescription(leaderboardText);
                }

                try {
                    const message = await channel.messages.fetch(config.messageId);
                    await message.edit({ embeds: [embed] });
                } catch (err) {
                    AuditLogger.error(`Leaderboard Message ${config.messageId} not found. Suggesting re-run of /setup-leaderboard.`);
                }
            }
        } catch (error: any) {
            AuditLogger.error('Leaderboard Job Failure', error?.stack);
        }
    });

    AuditLogger.info('Cron Job registered: Automatic Leaderboard Refresher (Every 10m)');
}
