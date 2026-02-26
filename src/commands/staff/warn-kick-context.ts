import { ContextMenuCommandBuilder, ApplicationCommandType, PermissionFlagsBits, type UserContextMenuCommandInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } from 'discord.js';
import type { Command } from '../../types/index.js';

const warnKickContextMenu: Command = {
    data: new ContextMenuCommandBuilder()
        .setName('🛡️ AVISAR OU EXPULSAR')
        .setType(ApplicationCommandType.User)
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

    async execute(interaction: UserContextMenuCommandInteraction) {
        const targetUser = interaction.targetUser;

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId(`btn_warn_user|${targetUser.id}`)
                .setLabel('Dar Aviso (Warn)')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('⚠️'),
            new ButtonBuilder()
                .setCustomId(`btn_kick_user|${targetUser.id}`)
                .setLabel('Expulsar (Kick)')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('🦶')
        );

        await interaction.reply({
            content: `🛡️ **CENTRAL DE MODERAÇÃO RÁPIDA**\n\nVocê selecionou o usuário: **${targetUser.tag}**\nQual ação punitiva deseja aplicar agora?`,
            components: [row],
            flags: MessageFlags.Ephemeral
        });
    },
};

export default warnKickContextMenu;
