import { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, type ButtonInteraction } from 'discord.js';
import type { ComponentHandler } from '../../types/index.js';

const kickUserButton: ComponentHandler<ButtonInteraction> = {
    id: 'btn_kick_user',

    async execute(interaction) {
        const targetUserId = interaction.customId.split('|')[1];

        const modal = new ModalBuilder()
            .setCustomId(`modal_kick_execute|${targetUserId}`)
            .setTitle('Expulsar Membro (Kick)');

        const reasonInput = new TextInputBuilder()
            .setCustomId('kick_reason')
            .setLabel('MOTIVO DA EXPULSÃO')
            .setPlaceholder('Explique por que este membro está sendo removido...')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

        modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(reasonInput));

        await interaction.showModal(modal);
    },
};

export default kickUserButton;
