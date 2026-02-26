import { ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageFlags, type ButtonInteraction } from 'discord.js';
import type { ComponentHandler } from '../../types/index.js';

const createGiveawayButton: ComponentHandler<ButtonInteraction> = {
    id: 'btn_create_giveaway',

    async execute(interaction) {
        // Ex: btn_create_giveaway|global ou btn_create_giveaway|vip
        const parts = interaction.customId.split('|');
        const targetType = parts[1] || 'global'; // Fallback

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId(`select_giveaway_category|${targetType}`)
            .setPlaceholder('Selecione a Categoria do Sorteio...')
            .addOptions(
                new StringSelectMenuOptionBuilder()
                    .setLabel('Garantir um Cargo Específico')
                    .setDescription('O Robô injeta um Cargo de hierarquia no Vencedor')
                    .setValue('ROLE')
                    .setEmoji('👑'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Pacote de Experiência (XP)')
                    .setDescription('O Robô credita saldo de Nível no Vencedor')
                    .setValue('XP')
                    .setEmoji('⚡'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Key / Código de Resgate Oculto')
                    .setDescription('O Robô entrega a Key na DM Privada do Vencedor')
                    .setValue('DIGITAL')
                    .setEmoji('🔑'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Resgate Manual / Customizado')
                    .setDescription('Drop Genérico. Vencedor abre Ticket para retirar')
                    .setValue('MANUAL')
                    .setEmoji('🎁')
            );

        const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

        await interaction.reply({
            content: `**Preparando o Sorteio (${targetType === 'vip' ? '💎 VIP' : '🌍 Global'})**\nPara que o Robô Autônomo funcione perfeitamente, escolha no menu abaixo a Categoria do Prêmio que será Sorteado:`,
            components: [row],
            flags: MessageFlags.Ephemeral
        });
    },
};

export default createGiveawayButton;
