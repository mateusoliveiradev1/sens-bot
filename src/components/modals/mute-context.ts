import { MessageFlags, type ModalSubmitInteraction } from 'discord.js';
import type { ComponentHandler } from '../../types/index.js';
import { UI } from '../../ui/embeds.js';
import { AuditLogger } from '../../utils/logger.js';

// Função auxiliar para parsear tempo (já temos no create-giveaway, mas vamos isolar ou repetir aqui por agilidade)
function parseDuration(duration: string): number | null {
    const match = duration.toLowerCase().trim().match(/^(\d+)(s|m|h|d)$/);
    if (!match) return null;
    const value = parseInt(match[1]);
    const unit = match[2];
    switch (unit) {
        case 's': return value * 1000;
        case 'm': return value * 60 * 1000;
        case 'h': return value * 60 * 60 * 1000;
        case 'd': return value * 24 * 60 * 60 * 1000;
        default: return null;
    }
}

const muteContextModal: ComponentHandler<ModalSubmitInteraction> = {
    id: 'modal_mute_context',

    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        try {
            const userId = interaction.customId.split('|')[1];
            const timeRaw = interaction.fields.getTextInputValue('mute_time');
            const reason = interaction.fields.getTextInputValue('mute_reason');

            const guild = interaction.guild;
            if (!guild) return;

            const targetMember = await guild.members.fetch(userId).catch(() => null);
            if (!targetMember) {
                await interaction.editReply({ embeds: [UI.error('Membro não encontrado', 'O usuário saiu do servidor ou o ID é inválido.')] });
                return;
            }

            const durationMs = parseDuration(timeRaw);
            if (!durationMs || durationMs < 5000) {
                await interaction.editReply({ embeds: [UI.error('Tempo Inválido', 'Use formatos como 10m, 1h, 24h. Mínimo 5s.')] });
                return;
            }

            // Aplica o Timeout (Mute Nativo do Discord)
            await targetMember.timeout(durationMs, reason);

            const successEmbed = UI.success('Membro Punido com Sucesso 🛡️', `O usuário ${targetMember.user.tag} foi mutado.\n\n**Duração:** \`${timeRaw}\`\n**Motivo:** ${reason}`);
            await interaction.editReply({ embeds: [successEmbed] });

            AuditLogger.systemEvent('⚖️ Punição: Mute de Contexto', `Staff ${interaction.user.tag} mutou ${targetMember.user.tag} por ${timeRaw}.\nRazão: ${reason}`, interaction.user);

        } catch (error: any) {
            AuditLogger.error('Mute Context Modal Execution Failure', error?.stack);
            await interaction.editReply({ content: '❌ Falha ao aplicar punição. Verifique se o Bot tem permissões de Moderador acima do cargo do alvo.' });
        }
    },
};

export default muteContextModal;
