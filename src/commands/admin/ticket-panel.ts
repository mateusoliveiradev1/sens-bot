import { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder, PermissionFlagsBits, TextChannel, MessageFlags } from 'discord.js';
import type { Command } from '../../types/index.js';
import { UI } from '../../ui/embeds.js';

const ticketPanelCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('ticket-panel')
        .setDescription('Gera o Painel Interativo de Suporte para a comunidade.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        if (!interaction.channel) return;

        const embed = UI.premium('Central de Suporte - Sens-PUBG', {
            description: 'Precisa de ajuda com o site, encontrou um bug ou quer parceria Comercial? Clique no botão abaixo para iniciar um atendimento privado com nossa equipe.',
        });

        const openTicketButton = new ButtonBuilder()
            .setCustomId('btn_open_ticket')
            .setLabel('Abrir Ticket 🎫')
            .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(openTicketButton as any);

        await (interaction.channel as TextChannel).send({ embeds: [embed], components: [row] });

        // Efemero para sumir a mensagem do admin
        await interaction.reply({ content: 'Painel gerado com sucesso.', flags: MessageFlags.Ephemeral });
    },
};

export default ticketPanelCommand;
