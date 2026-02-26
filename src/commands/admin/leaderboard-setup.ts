import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChatInputCommandInteraction, TextChannel } from 'discord.js';
import type { Command } from '../../types/index.js';
import { db } from '../../database/index.js';
import { leaderboardConfigs } from '../../database/schema.js';
import { AuditLogger } from '../../utils/logger.js';

const leaderboardSetupCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('setup-leaderboard')
        .setDescription('Inicializa o Painel de Ranking Automático (Hall da Fama Versão 5.0)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            const channel = interaction.channel;
            if (!channel || !channel.isTextBased()) {
                await interaction.editReply({ content: '❌ Este comando deve ser executado em um canal de texto válido.' });
                return;
            }

            const initialEmbed = new EmbedBuilder()
                .setTitle('🏆 HALL DA FAMA: TOP 10 SENS-PUBG')
                .setColor(0x9333ea)
                .setDescription('⌛ Inicializando sincronização de dados com o banco Neon...\n*Este painel será atualizado automaticamente em instantes.*')
                .setTimestamp()
                .setFooter({ text: 'Sens-Bot Security Engine' });

            const textChannel = channel as TextChannel;
            const message = await textChannel.send({ embeds: [initialEmbed.data] });

            // Salva ou Atualiza a configuração no banco
            await db.insert(leaderboardConfigs)
                .values({
                    guildId: interaction.guildId!,
                    channelId: channel.id,
                    messageId: message.id,
                    lastUpdated: new Date()
                })
                .onConflictDoUpdate({
                    target: leaderboardConfigs.guildId,
                    set: {
                        channelId: channel.id,
                        messageId: message.id,
                        lastUpdated: new Date()
                    }
                });

            AuditLogger.info(`Leaderboard Panel initialized by ${interaction.user.tag} in ${channel.id}`);
            await interaction.editReply({ content: `✅ **Painel de Ranking Vivo** inicializado com sucesso em <#${channel.id}>! O motor de refresh automático cuidará do resto.` });

        } catch (error: any) {
            AuditLogger.error('Leaderboard Setup Failure', error?.stack);
            await interaction.editReply({ content: '❌ Falha crítica ao tentar registrar o painel de ranking no banco de dados.' });
        }
    },
};

export default leaderboardSetupCommand;
