import { MessageFlags, type ModalSubmitInteraction, TextChannel } from 'discord.js';
import type { ComponentHandler } from '../../types/index.js';
import { db } from '../../database/index.js';
import { supportTickets, ticketTranscripts } from '../../database/schema.js';
import { eq } from 'drizzle-orm';
import { AuditLogger } from '../../utils/logger.js';
import { UI } from '../../ui/embeds.js';
import { randomUUID } from 'node:crypto';

const resolveTicketModal: ComponentHandler<ModalSubmitInteraction> = {
    id: 'modal_resolve_ticket',

    async execute(interaction) {
        if (!interaction.guild || !interaction.channel) return;

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const resolutionDesc = interaction.fields.getTextInputValue('resolution_desc');

        try {
            // Confirm explicitly if they are inside a TextChannel and update DB
            if (interaction.channel instanceof TextChannel && interaction.channelId) {
                // Fetch the ticket from memory DB to prove it exists
                const ticketData = await db.select().from(supportTickets).where(eq(supportTickets.id, interaction.channelId)).limit(1);

                if (ticketData.length > 0) {
                    await db.update(supportTickets)
                        .set({ status: 'CLOSED', closedAt: new Date(), resolutionNote: resolutionDesc })
                        .where(eq(supportTickets.id, interaction.channelId));

                    // --- NOVA LÓGICA DE TRANSCRIÇÃO ---
                    try {
                        const messages = await interaction.channel.messages.fetch({ limit: 100 });
                        const transcriptData = messages.reverse().map(m => ({
                            author: m.author.tag,
                            content: m.content,
                            timestamp: m.createdAt.toISOString()
                        }));

                        await db.insert(ticketTranscripts).values({
                            id: randomUUID(),
                            ticketId: interaction.channelId,
                            content: JSON.stringify(transcriptData),
                        });
                        AuditLogger.info(`Transcript generated for ticket ${interaction.channel.name}`);
                    } catch (transcriptError: any) {
                        AuditLogger.error('Failed to generate ticket transcript', transcriptError?.message);
                    }
                    // ----------------------------------
                }

                // Dispara o novo Dashboard Premium de Auditoria!
                const ticketReason = ticketData.length > 0 ? ticketData[0].reason : 'Não Registrado (Ticket Obsoleta)';
                AuditLogger.ticketReport(interaction.channel.name, ticketReason, resolutionDesc, interaction.user);

                const embed = UI.premium('Atendimento Encerrado e Auditado', { description: 'O Desfecho foi arquivado perante a Administração.\nEste canal será **desintegrado** em 5 segundos...' });
                await interaction.editReply({ embeds: [embed] });

                // Auto Delete Channel gracefully after letting the user read the closure state.
                setTimeout(async () => {
                    try {
                        await interaction.channel?.delete('Ticket Resolvido (Audit UI)');
                    } catch (e) {
                        // Ignored
                    }
                }, 5000);
            }
        } catch (error: any) {
            AuditLogger.error(`Failed to close, audit, and delete ticket channel ${interaction.channel?.id}`, error?.message);
            await interaction.editReply({ content: 'Ocorreu um erro letal no banco de dados ao tentar auditar este ticket.' });
        }
    },
};

export default resolveTicketModal;
