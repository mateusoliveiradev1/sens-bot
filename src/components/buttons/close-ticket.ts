import { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, type ButtonInteraction } from 'discord.js';
import type { ComponentHandler } from '../../types/index.js';

const closeTicketButton: ComponentHandler<ButtonInteraction> = {
    id: 'btn_close_ticket', // Static exact ID match from our Custom Interaction Router

    async execute(interaction) {
        if (!interaction.guild || !interaction.channel) return;

        // Generates the native Discord popup form for Ticket Resolution
        const modal = new ModalBuilder()
            .setCustomId('modal_resolve_ticket')
            .setTitle('📝 Desfecho do Atendimento');

        const resolutionInput = new TextInputBuilder()
            .setCustomId('resolution_desc')
            .setLabel('COMO ESSE CASO FOI RESOLVIDO?')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Ex: Problema resolvido, VIP ativado. (Ou: Usuário não respondeu, encerrado por inatividade).')
            .setRequired(true)
            .setMinLength(5)
            .setMaxLength(1000);

        const row = new ActionRowBuilder<TextInputBuilder>().addComponents(resolutionInput);
        modal.addComponents(row);

        // Show the modal to the staff immediately
        await interaction.showModal(modal);
    },
};

export default closeTicketButton;
