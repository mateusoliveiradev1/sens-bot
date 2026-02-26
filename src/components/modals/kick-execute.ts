import { MessageFlags, type ModalSubmitInteraction } from 'discord.js';
import type { ComponentHandler } from '../../types/index.js';
import { UI } from '../../ui/embeds.js';
import { AuditLogger } from '../../utils/logger.js';

const kickExecuteModal: ComponentHandler<ModalSubmitInteraction> = {
    id: 'modal_kick_execute',

    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        try {
            const targetId = interaction.customId.split('|')[1];
            const reason = interaction.fields.getTextInputValue('kick_reason');

            const guild = interaction.guild;
            if (!guild) return;

            const targetMember = await guild.members.fetch(targetId).catch(() => null);
            if (!targetMember) {
                await interaction.editReply({ embeds: [UI.error('Membro não encontrado', 'O usuário já não está no servidor ou o ID é inválido.')] });
                return;
            }

            if (!targetMember.kickable) {
                await interaction.editReply({ embeds: [UI.error('Ação Negada', 'O Bot não tem permissões para expulsar este membro (cargo superior ou dono).')] });
                return;
            }

            // Tenta avisar antes de chutar
            try {
                await targetMember.send(`🦶 **VOCÊ FOI EXPULSO: SENS-PUBG**\n\nEquipe de Moderação decidiu por sua remoção.\n**Motivo:** ${reason}\n\n*Você pode tentar retornar ao servidor se tiver um convite válido, mas siga as regras.*`);
            } catch { }

            await targetMember.kick(reason);

            const successEmbed = UI.success('Membro Expulso ✅', `O usuário **${targetMember.user.tag}** foi removido do servidor.\n**Motivo:** ${reason}`);
            await interaction.editReply({ embeds: [successEmbed] });

            AuditLogger.systemEvent('⚖️ Punição: Kick de Contexto', `Staff ${interaction.user.tag} expulsou ${targetMember.user.tag}.\nRazão: ${reason}`, interaction.user);

        } catch (error: any) {
            AuditLogger.error('Kick Execute Modal Failure', error?.stack);
            await interaction.editReply({ content: '❌ Falha crítica ao tentar expulsar o membro.' });
        }
    },
};

export default kickExecuteModal;
