import { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, type ButtonInteraction } from 'discord.js';
import type { ComponentHandler } from '../../types/index.js';

const warnUserButton: ComponentHandler<ButtonInteraction> = {
    id: 'btn_warn_user',

    async execute(interaction) {
        const targetUserId = interaction.customId.split('|')[1];

        const modal = new ModalBuilder()
            .setCustomId(`modal_warn_execute|${targetUserId}`)
            .setTitle('Emitir Aviso Formal (Warn)');

        const reasonInput = new TextInputBuilder()
            .setCustomId('warn_reason')
            .setLabel('MOTIVO DO AVISO')
            .setPlaceholder('Descreva a infração cometida pelo membro...')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

        modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(reasonInput));

        await interaction.showModal(modal);
    },
};

export default warnUserButton;
