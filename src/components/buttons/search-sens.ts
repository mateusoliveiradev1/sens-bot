import { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, type ButtonInteraction } from 'discord.js';
import type { ComponentHandler } from '../../types/index.js';

const searchSensButton: ComponentHandler<ButtonInteraction> = {
    id: 'btn_search_sens',

    async execute(interaction) {
        const modal = new ModalBuilder()
            .setCustomId('modal_search_sens_db')
            .setTitle('Busca Neural Sens-PUBG');

        const nameInput = new TextInputBuilder()
            .setCustomId('player_name')
            .setLabel("Qual Pro-Player você deseja encontrar?")
            .setPlaceholder("Ex: beellz, sparkingg, tgltn")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const row = new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput);
        modal.addComponents(row);

        await interaction.showModal(modal);
    },
};

export default searchSensButton;
