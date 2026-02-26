import { ContextMenuCommandBuilder, ApplicationCommandType, PermissionFlagsBits, type UserContextMenuCommandInteraction, EmbedBuilder } from 'discord.js';
import type { Command } from '../../types/index.js';
import { db } from '../../database/index.js';
import { auditLogs } from '../../database/schema.js';
import { like, desc, or } from 'drizzle-orm';
import { AuditLogger } from '../../utils/logger.js';

const viewLogsContextMenu: Command = {
    data: new ContextMenuCommandBuilder()
        .setName('📜 VER LOGS DO MEMBRO')
        .setType(ApplicationCommandType.User)
        .setDefaultMemberPermissions(PermissionFlagsBits.ViewAuditLog),

    async execute(interaction: UserContextMenuCommandInteraction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            const targetId = interaction.targetId;
            const targetUser = interaction.targetUser;

            // Busca os últimos 5 logs onde o ID do usuário aparece na mensagem (Busca textual no DB)
            const logs = await db.select().from(auditLogs)
                .where(or(
                    like(auditLogs.message, `%${targetId}%`),
                    like(auditLogs.message, `%${targetUser.tag}%`)
                ))
                .orderBy(desc(auditLogs.createdAt))
                .limit(5);

            if (logs.length === 0) {
                await interaction.editReply({ content: `✅ Nenhuma ocorrência ou log de auditoria encontrado para **${targetUser.tag}**.` });
                return;
            }

            const logEmbed = new EmbedBuilder()
                .setTitle(`📜 Dossiê de Auditoria: ${targetUser.username}`)
                .setColor(0x3b82f6) // Blue Premium
                .setThumbnail(targetUser.displayAvatarURL())
                .setDescription(`Solicitado por: <@${interaction.user.id}>\nExibindo os últimos **${logs.length}** registros encontrados no banco Neon:`)
                .setTimestamp();

            const levelIcons: Record<string, string> = {
                'INFO': '🔹',
                'WARN': '⚠️',
                'ERROR': '🚨',
                'SYSTEM': '⚙️',
                'SUCCESS': '✅'
            };

            for (const log of logs) {
                const icon = levelIcons[log.level] || '🔘';
                const timeStr = `<t:${Math.floor(log.createdAt.getTime() / 1000)}:R>`;

                logEmbed.addFields({
                    name: `${icon} [${log.level}] | ${timeStr}`,
                    value: `> ${log.message.replace(/`/g, '')}`
                });
            }

            logEmbed.setFooter({ text: 'Sens-Bot Security Engine', iconURL: interaction.client.user?.displayAvatarURL() });

            await interaction.editReply({ embeds: [logEmbed] });

        } catch (error: any) {
            AuditLogger.error('View Logs Execution Fault', error?.stack);
            await interaction.editReply({ content: '❌ Erro crítico ao consultar o banco de dados de auditoria.' });
        }
    },
};

export default viewLogsContextMenu;
