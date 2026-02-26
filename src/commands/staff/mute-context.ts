import { ContextMenuCommandBuilder, ApplicationCommandType, PermissionFlagsBits, type UserContextMenuCommandInteraction, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from 'discord.js';
import type { Command } from '../../types/index.js';

const muteContextMenu: Command = {
    data: new ContextMenuCommandBuilder()
        .setName('🛡️ MUTAR INFRATOR')
        .setType(ApplicationCommandType.User)
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction: UserContextMenuCommandInteraction) {
        const targetMember = interaction.targetMember;
        if (!targetMember) return;

        // Abre um Modal para definir o tempo e motivo
        const modal = new ModalBuilder()
            .setCustomId(`modal_mute_context|${interaction.targetId}`)
            .setTitle(`Mutar: ${interaction.targetUser.username}`);

        const timeInput = new TextInputBuilder()
            .setCustomId('mute_time')
            .setLabel('TEMPO DO MUTE (Ex: 1h, 12h, 1d, 7d)')
            .setPlaceholder('Exemplos de formato: 60s, 30m, 1h, 24h, 7d')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMaxLength(10);

        const reasonInput = new TextInputBuilder()
            .setCustomId('mute_reason')
            .setLabel('MOTIVO DA PUNIÇÃO (RAZÃO)')
            .setPlaceholder('Ex: Spam no chat, Desrespeito a equipe, Toxicidade')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setMaxLength(500);

        modal.addComponents(
            new ActionRowBuilder<TextInputBuilder>().addComponents(timeInput),
            new ActionRowBuilder<TextInputBuilder>().addComponents(reasonInput)
        );

        await interaction.showModal(modal);
    },
};

export default muteContextMenu;
