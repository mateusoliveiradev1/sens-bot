import { type ButtonInteraction, MessageFlags, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import type { ComponentHandler } from '../../types/index.js';
import { db } from '../../database/index.js';
import { giveaways, giveawayParticipants } from '../../database/schema.js';
import { eq, and } from 'drizzle-orm';

const joinGiveawayButton: ComponentHandler<ButtonInteraction> = {
    id: 'btn_join_giveaway',

    async execute(interaction) {
        // Ex: btn_join_giveaway|<messageId>
        const parts = interaction.customId.split('|');
        const giveawayMsgId = parts[1];

        // Se o evento estiver quebrado
        if (!giveawayMsgId || giveawayMsgId === 'JOIN' || giveawayMsgId === '0') {
            await interaction.reply({ content: '❌ Este botão não foi atrelado ao banco de dados corretamente. (Sincronizando)', flags: MessageFlags.Ephemeral });
            return;
        }

        // Validar se o Sorteio ainda existe banco via Query Builders (sempre seguros)
        const giveawayDataList = await db.select().from(giveaways).where(eq(giveaways.messageId, giveawayMsgId));
        const giveawayData = giveawayDataList[0];

        if (!giveawayData) {
            await interaction.reply({ content: '❌ Este sorteio não existe mais ou os registros foram apagados.', flags: MessageFlags.Ephemeral });
            return;
        }

        if (giveawayData.status !== 'ACTIVE' || Date.now() > giveawayData.endsAt.getTime()) {
            await interaction.reply({ content: '⏳ Este sorteio já está encerrado!', flags: MessageFlags.Ephemeral });
            return;
        }

        // Tentar ver se o cara já tá participando
        const userJoinedList = await db.select().from(giveawayParticipants).where(
            and(
                eq(giveawayParticipants.giveawayId, giveawayMsgId),
                eq(giveawayParticipants.userId, interaction.user.id)
            )
        );

        if (userJoinedList.length > 0) {
            // No futuro pode ter botão secundário para desmarcar 
            await interaction.reply({ content: '⭐ Você já confirmou sua entrada neste Sorteio! Boa sorte!', flags: MessageFlags.Ephemeral });
            return;
        }

        // Inserir Registro Implacável
        await db.insert(giveawayParticipants).values({
            giveawayId: giveawayMsgId,
            userId: interaction.user.id
        });

        // Sucesso visual UX para o Membro
        await interaction.reply({ content: `✅ Participação Confirmada! Você agora está listado para concorrer a **${giveawayData.prize}**.`, flags: MessageFlags.Ephemeral });

        // Update numérico vivo das Participações
        try {
            const allParticipants = await db.select().from(giveawayParticipants).where(eq(giveawayParticipants.giveawayId, giveawayMsgId));
            const total = allParticipants.length;

            const existingEmbed = interaction.message.embeds[0];
            const updatedEmbed = EmbedBuilder.from(existingEmbed);

            const customJoinButton = new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder().setCustomId(`btn_join_giveaway|${giveawayMsgId}`).setLabel(`🎉 Participar (${total} Inscritos)`).setStyle(ButtonStyle.Primary)
            );
            await interaction.message.edit({ embeds: [updatedEmbed], components: [customJoinButton] });
        } catch (e) {
            // Ignorar Race Conditions do Discord
        }
    },
};

export default joinGiveawayButton;
