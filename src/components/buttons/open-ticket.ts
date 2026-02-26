import { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, type ButtonInteraction } from 'discord.js';
import type { ComponentHandler } from '../../types/index.js';

const openTicketButton: ComponentHandler<ButtonInteraction> = {
    id: 'btn_open_ticket',

    async execute(interaction) {
        // Generates the native Discord popup form
        const modal = new ModalBuilder()
            .setCustomId('modal_ticket_reason')
            .setTitle('🎫 Central de Solitações Sens-PUBG');

        const descInput = new TextInputBuilder()
            .setCustomId('ticket_desc')
            .setLabel('INFORME O PROBLEMA (MOTIVO):')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Ex: Comprei VIP e não recebi. Detalhe bem seu problema para agilizar o suporte da moderação.')
            .setRequired(true)
            .setMinLength(10)
            .setMaxLength(1000);

        const row = new ActionRowBuilder<TextInputBuilder>().addComponents(descInput);
        modal.addComponents(row);

        // Show the modal to the user immediately
        await interaction.showModal(modal);
    },
};

export default openTicketButton;
