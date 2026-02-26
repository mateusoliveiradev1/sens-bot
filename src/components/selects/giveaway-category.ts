import { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, type StringSelectMenuInteraction } from 'discord.js';
import type { ComponentHandler } from '../../types/index.js';

const selectGiveawayCategory: ComponentHandler<StringSelectMenuInteraction> = {
    id: 'select_giveaway_category',

    async execute(interaction) {
        // Ex: select_giveaway_category|global
        const parts = interaction.customId.split('|');
        const targetType = parts[1] || 'global';

        // A Categoria escolhida (ROLE, XP, DIGITAL, MANUAL)
        const selectedCategory = interaction.values[0];

        // Precisamos passar o `targetType` e `selectedCategory` na frente pro Modal
        const modalCustomId = `modal_cria_sorteio|${targetType}|${selectedCategory}`;
        const modal = new ModalBuilder().setCustomId(modalCustomId);

        // Inputs Universais
        const premioInput = new TextInputBuilder()
            .setCustomId('giveaway_prize')
            .setLabel('TÍTULO DO PRÊMIO Ofertado')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder(selectedCategory === 'ROLE' ? 'Ex: VIP Gold 30 Dias' : 'Ex: 50.000 XP')
            .setRequired(true)
            .setMaxLength(100);

        const tempoInput = new TextInputBuilder()
            .setCustomId('giveaway_time')
            .setLabel('TEMPO DE DURAÇÃO (Ex: 24h, 2d, 30m)')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setPlaceholder('Ex: 24h, 1d, 30m')
            .setMaxLength(10);

        const ganhadoresInput = new TextInputBuilder()
            .setCustomId('giveaway_winners')
            .setLabel('QUANTIDADE DE GANHADORES')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setValue('1')
            .setMaxLength(3);

        const imageInput = new TextInputBuilder()
            .setCustomId('giveaway_image')
            .setLabel('URL DA IMAGEM DO PRÊMIO (Opcional)')
            .setStyle(TextInputStyle.Short)
            .setRequired(false);

        // Customização baseada na Categoria Ecolhida
        if (selectedCategory === 'ROLE') {
            modal.setTitle(targetType === 'vip' ? '👑 Sorteio de Cargo VIP' : '👑 Sorteio de Cargo Hierárquico');
            const dataInput = new TextInputBuilder()
                .setCustomId('giveaway_data')
                .setLabel('ID DO CARGO QUE O BOT IRÁ ENTREGAR')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Copie o ID do Cargo no Discord (Ex: 118491)')
                .setRequired(true);
            modal.addComponents(
                new ActionRowBuilder<TextInputBuilder>().addComponents(premioInput),
                new ActionRowBuilder<TextInputBuilder>().addComponents(dataInput),
                new ActionRowBuilder<TextInputBuilder>().addComponents(tempoInput),
                new ActionRowBuilder<TextInputBuilder>().addComponents(ganhadoresInput),
                new ActionRowBuilder<TextInputBuilder>().addComponents(imageInput)
            );
        } else if (selectedCategory === 'XP') {
            modal.setTitle(targetType === 'vip' ? '⚡ Sorteio de XP VIP' : '⚡ Sorteio Global de XP');
            const dataInput = new TextInputBuilder()
                .setCustomId('giveaway_data')
                .setLabel('QUANTIDADE EXATA DE XP (APENAS NÚMERO)')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Ex: 50000 (Sem pontos ou vírgulas)')
                .setRequired(true);
            modal.addComponents(
                new ActionRowBuilder<TextInputBuilder>().addComponents(premioInput),
                new ActionRowBuilder<TextInputBuilder>().addComponents(dataInput),
                new ActionRowBuilder<TextInputBuilder>().addComponents(tempoInput),
                new ActionRowBuilder<TextInputBuilder>().addComponents(ganhadoresInput),
                new ActionRowBuilder<TextInputBuilder>().addComponents(imageInput)
            );
        } else if (selectedCategory === 'DIGITAL') {
            modal.setTitle(targetType === 'vip' ? '🔑 Sorteio KEY/G-Coin VIP' : '🔑 Sorteio de Key Pública');
            const dataInput = new TextInputBuilder()
                .setCustomId('giveaway_data')
                .setLabel('CÓDIGO (KEY) PARA ENTREGA NO PRIVADO')
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder('Cole aqui a Key / G-Code. Se for mais de 1 ganhador, separe por vírgulas.')
                .setRequired(true);
            modal.addComponents(
                new ActionRowBuilder<TextInputBuilder>().addComponents(premioInput),
                new ActionRowBuilder<TextInputBuilder>().addComponents(dataInput),
                new ActionRowBuilder<TextInputBuilder>().addComponents(tempoInput),
                new ActionRowBuilder<TextInputBuilder>().addComponents(ganhadoresInput),
                new ActionRowBuilder<TextInputBuilder>().addComponents(imageInput)
            );
        } else {
            // MANUAL / Standard
            modal.setTitle(targetType === 'vip' ? '🎁 Sorteio Manual VIP' : '🎁 Sorteio Automático Global');
            modal.addComponents(
                new ActionRowBuilder<TextInputBuilder>().addComponents(premioInput),
                new ActionRowBuilder<TextInputBuilder>().addComponents(tempoInput),
                new ActionRowBuilder<TextInputBuilder>().addComponents(ganhadoresInput),
                new ActionRowBuilder<TextInputBuilder>().addComponents(imageInput)
            );
        }

        await interaction.showModal(modal);
    },
};

export default selectGiveawayCategory;
