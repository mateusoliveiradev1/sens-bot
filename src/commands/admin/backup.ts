import { PermissionFlagsBits, SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js';
import type { Command } from '../../types/index.js';
import { runBackup } from '../../jobs/backup.js';
import { UI } from '../../ui/embeds.js';
import { AuditLogger } from '../../utils/logger.js';

const backupCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('backup')
        .setDescription('ADMIN: Executa um backup manual do banco de dados imediatamente.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild) return;

        await interaction.deferReply({ ephemeral: true });

        try {
            const result = await runBackup();

            if (result.success) {
                const embed = UI.success(
                    'Backup Concluído com Sucesso ✅',
                    `O backup foi gerado e armazenado localmente.\n\n**Arquivo:** \`${result.filename}\`\n**Tamanho:** \`${result.sizeMB} MB\``
                );
                await interaction.editReply({ embeds: [embed] });

                AuditLogger.systemEvent(
                    'Manual Backup Executed',
                    `Backup \`${result.filename}\` created via slash command by ${interaction.user.tag}`,
                    interaction.user
                );
            } else {
                const embed = UI.error(
                    'Falha no Backup ❌',
                    `Ocorreu um erro ao gerar o backup: \`${result.error}\``
                );
                await interaction.editReply({ embeds: [embed] });
            }
        } catch (error: any) {
            const errEmbed = UI.error('Erro de Execução', error?.message || 'Erro desconhecido');
            await interaction.editReply({ embeds: [errEmbed] });
        }
    },
};

export default backupCommand;
