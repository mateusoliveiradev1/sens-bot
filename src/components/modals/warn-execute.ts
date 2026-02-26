import { MessageFlags, type ModalSubmitInteraction } from 'discord.js';
import type { ComponentHandler } from '../../types/index.js';
import { UI } from '../../ui/embeds.js';
import { AuditLogger } from '../../utils/logger.js';

const warnExecuteModal: ComponentHandler<ModalSubmitInteraction> = {
    id: 'modal_warn_execute',

    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        try {
            const targetId = interaction.customId.split('|')[1];
            const reason = interaction.fields.getTextInputValue('warn_reason');

            const targetUser = await interaction.client.users.fetch(targetId);

            // Tenta avisar o usuário na DM
            let dmStatus = '✅ DM Enviada';
            try {
                await targetUser.send(`⚠️ **AVISO FORMAL: SENS-PUBG**\n\nVocê recebeu um aviso da nossa equipe de Moderação.\n**Motivo:** ${reason}\n\n*Por favor, siga as regras da comunidade para evitar punições mais severas como mute ou banimento.*`);
            } catch {
                dmStatus = '❌ DM Fechada';
            }

            const successEmbed = UI.success('Aviso Aplicado ✅', `O usuário ${targetUser.tag} foi avisado.\n**Motivo:** ${reason}\n**Status da DM:** ${dmStatus}`);
            await interaction.editReply({ embeds: [successEmbed] });

            AuditLogger.systemEvent('⚠️ Advertência: Warn de Contexto', `Staff ${interaction.user.tag} avisou ${targetUser.tag}.\nRazão: ${reason} | DM: ${dmStatus}`, interaction.user);

        } catch (error: any) {
            AuditLogger.error('Warn Execute Modal Failure', error?.stack);
            await interaction.editReply({ content: '❌ Erro ao processar o aviso.' });
        }
    },
};

export default warnExecuteModal;
