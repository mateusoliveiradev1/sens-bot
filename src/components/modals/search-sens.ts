import { MessageFlags, type ModalSubmitInteraction } from 'discord.js';
import type { ComponentHandler } from '../../types/index.js';
import { UI } from '../../ui/embeds.js';
import { db } from '../../database/index.js';
import { proPlayersCache } from '../../database/schema.js';
import { eq } from 'drizzle-orm';
import { AuditLogger } from '../../utils/logger.js';

const searchSensModal: ComponentHandler<ModalSubmitInteraction> = {
    id: 'modal_search_sens_db',

    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const playerSlug = interaction.fields.getTextInputValue('player_name').toLowerCase().replace(/\s+/g, '-');

        try {
            const result = await db.select().from(proPlayersCache).where(eq(proPlayersCache.id, playerSlug)).limit(1);

            if (result.length === 0) {
                const notFoundEmbed = UI.error(
                    'Operador Não Encontrado',
                    `Não localizamos nenhum pro-player associado ao id \`${playerSlug}\` no banco de dados sincronizado do site Sens-PUBG.`
                );
                await interaction.editReply({ embeds: [notFoundEmbed] });
                return;
            }

            const player = result[0];

            const responseEmbed = UI.premium(`Configurações: ${player.name}`, {
                description: `Sincronização Neon Serverless obtida com sucesso.\n*Atualizado no site em ${new Date(player.lastUpdated).toLocaleDateString()}*`,
                fields: [
                    { name: '🖱️ Mouse', value: player.mouseName || 'Desconhecido', inline: true },
                    { name: '⚡ DPI', value: `${player.dpi || 0} dpi`, inline: true },
                    { name: '🔄 Polling Rate', value: `${player.pollingRate || 0} Hz`, inline: true },
                    { name: '🎮 Sens Global', value: `${player.inGameSens || 0}`, inline: true },
                    { name: '👁️ FOV', value: `${player.fov || 0}`, inline: true },
                    { name: '↕️ Ver. Multiplier', value: `${player.verticalMultiplier || 0}`, inline: true }
                ]
            });

            await interaction.editReply({ embeds: [responseEmbed] });
            AuditLogger.info(`[Sens Fetch] Membro ${interaction.user.tag} consultou os dados de ${playerSlug}.`);

            // Desaparece com a resposta após 60 segundos conforme pedido pelo Usuário (UX Supremo)
            setTimeout(async () => {
                try { await interaction.deleteReply(); } catch (e) { }
            }, 60000);

        } catch (error: any) {
            AuditLogger.error('Neon DB Fetch failed in Sens Modal', error?.message);
            await interaction.editReply({ content: 'Falha letal ao se comunicar com o PostgreSQL de Cache. Tente novamente mais tarde.' });
            setTimeout(async () => { try { await interaction.deleteReply(); } catch (e) { } }, 15000);
        }
    },
};

export default searchSensModal;
