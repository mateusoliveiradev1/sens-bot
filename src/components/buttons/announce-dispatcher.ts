import { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, type ButtonInteraction } from 'discord.js';
import type { ComponentHandler } from '../../types/index.js';

const announceDispatcherButton: ComponentHandler<ButtonInteraction> = {
    // Intercepta qualquer ID que comece com btn_announce
    id: 'btn_announce',

    async execute(interaction) {
        // Ex: btn_announce|12345678|info
        const parts = interaction.customId.split('|');
        const canalId = parts[1];
        const cor = parts[2];

        // Repassa os metadados de cor e sala para o Modal_anuncio final
        const modal = new ModalBuilder()
            .setCustomId(`modal_anuncio|${canalId}|${cor}`)
            .setTitle('Formulário de Anúncio Supremo');

        const titleInput = new TextInputBuilder()
            .setCustomId('announce_title')
            .setLabel('TÍTULO DO ANÚNCIO / NOVIDADE')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMaxLength(256);

        const descInput = new TextInputBuilder()
            .setCustomId('announce_desc')
            .setLabel('CONTEÚDO DA MENSAGEM (Com suporte a emojis)')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setMaxLength(3900);

        const imageInput = new TextInputBuilder()
            .setCustomId('announce_image')
            .setLabel('URL DO BANNER DE IMAGEM (Opcional)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Ex: https://media.discordapp.net/attachments/...')
            .setRequired(false);

        modal.addComponents(
            new ActionRowBuilder<TextInputBuilder>().addComponents(titleInput),
            new ActionRowBuilder<TextInputBuilder>().addComponents(descInput),
            new ActionRowBuilder<TextInputBuilder>().addComponents(imageInput)
        );

        // Dispara o Popup nativo na tela do administrador
        await interaction.showModal(modal);
    },
};

export default announceDispatcherButton;
