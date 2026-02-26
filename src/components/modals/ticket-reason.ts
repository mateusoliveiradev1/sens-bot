import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits, MessageFlags, type ModalSubmitInteraction } from 'discord.js';
import type { ComponentHandler } from '../../types/index.js';
import { UI } from '../../ui/embeds.js';
import { AuditLogger } from '../../utils/logger.js';
import { db } from '../../database/index.js';
import { supportTickets } from '../../database/schema.js';

const ticketReasonModal: ComponentHandler<ModalSubmitInteraction> = {
    id: 'modal_ticket_reason',

    async execute(interaction) {
        if (!interaction.guild) return;

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const reason = interaction.fields.getTextInputValue('ticket_desc');
        const ticketName = `ticket-${interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}`;

        try {
            const staffRole = interaction.guild.roles.cache.find(r => r.name === '👑 SENS | ADMINISTRADOR');
            const supportRole = interaction.guild.roles.cache.find(r => r.name === '🎧 SENS | SUPORTE');

            const ticketChannel = await interaction.guild.channels.create({
                name: ticketName,
                type: ChannelType.GuildText,
                topic: `Ticket Owner: ${interaction.user.id}`,
                permissionOverwrites: [
                    {
                        id: interaction.guild.id,
                        deny: [PermissionFlagsBits.ViewChannel],
                    },
                    {
                        id: interaction.user.id,
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
                    },
                    // Allows Admins to view
                    ...(staffRole ? [{
                        id: staffRole.id,
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                    }] : []),
                    // Allows Support to view
                    ...(supportRole ? [{
                        id: supportRole.id,
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                    }] : []),
                    {
                        id: interaction.client.user.id,
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels],
                    }
                ],
            });

            // Registrar no Banco de Dados
            await db.insert(supportTickets).values({
                id: ticketChannel.id,
                userId: interaction.user.id,
                reason: reason,
                status: 'OPEN',
                resolutionNote: null, // explicitamente nulo na criação para casar com a constraint
            });

            const welcomeEmbed = UI.premium(`Atendimento Solicitado: ${interaction.user.username}`, {
                description: `A nossa equipe de moderação **Sens-PUBG** foi notificada com a sua solicitação e em breve investigará as vertentes do seu caso para resolvê-lo.\n\n### 📝 Relatório do Solicitante\n> ${reason}\n\n⚠️ *Este canal é restrito a você e aos staffs de Nivel 2 ou superior. Clicar no botão abaixo causará a exclusão automática instantânea.*`,
            });

            // Add member thumbnail for better visual polish
            welcomeEmbed.setThumbnail(interaction.user.displayAvatarURL());

            const closeButton = new ButtonBuilder()
                .setCustomId(`btn_close_ticket`)
                .setLabel('🗑️ Encerrar Atendimento')
                .setStyle(ButtonStyle.Danger);

            const row = new ActionRowBuilder<ButtonBuilder>().addComponents(closeButton);

            await ticketChannel.send({ content: `<@${interaction.user.id}>`, embeds: [welcomeEmbed], components: [row] });

            AuditLogger.ticketCreated(ticketName, interaction.user);

            await interaction.editReply({ content: `✅ Ticket de Suporte gerado perfeitamente: <#${ticketChannel.id}>` });

        } catch (error: any) {
            AuditLogger.error('Failed to provision Support Ticket Channel and DB Entry', error?.message);
            await interaction.editReply({ content: '❌ Falha crítica ao gravar o ticket na nuvem de dados. Tente novamente ou abra mão da Moderação.' });
        }
    },
};

export default ticketReasonModal;
