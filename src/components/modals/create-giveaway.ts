import { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags, TextChannel } from 'discord.js';
import type { ComponentHandler } from '../../types/index.js';
import { UI } from '../../ui/embeds.js';
import { db } from '../../database/index.js';
import { giveaways } from '../../database/schema.js';
import { AuditLogger } from '../../utils/logger.js';

// Função auxiliar para converter strings (ex: 2d, 24h, 30m) para MS
function parseDuration(duration: string): number | null {
    const match = duration.toLowerCase().trim().match(/^(\d+)(s|m|h|d)$/);
    if (!match) return null;
    const value = parseInt(match[1]);
    const unit = match[2];
    switch (unit) {
        case 's': return value * 1000;
        case 'm': return value * 60 * 1000;
        case 'h': return value * 60 * 60 * 1000;
        case 'd': return value * 24 * 60 * 60 * 1000;
        default: return null;
    }
}

const createGiveawayModal: ComponentHandler<any> = {
    id: 'modal_cria_sorteio',

    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        try {
            const parts = interaction.customId.split('|');
            const targetType = parts[1] || 'global';
            const rewardType = parts[2] || 'MANUAL';

            const prize = interaction.fields.getTextInputValue('giveaway_prize');
            const timeRaw = interaction.fields.getTextInputValue('giveaway_time');
            const winnersRaw = interaction.fields.getTextInputValue('giveaway_winners');

            let image = null;
            let rewardData = null;

            try { image = interaction.fields.getTextInputValue('giveaway_image'); } catch { }

            // Só tentamos puxar o data se a categoria exigir
            if (rewardType !== 'MANUAL') {
                try { rewardData = interaction.fields.getTextInputValue('giveaway_data'); } catch { }
            }

            // Validações Básicas
            const timeMs = parseDuration(timeRaw);
            if (!timeMs) {
                return await interaction.editReply({ content: '❌ Formato de tempo inválido! Use `24h`, `2d` ou `30m`.' });
            }

            const winnersCount = parseInt(winnersRaw);
            if (isNaN(winnersCount) || winnersCount < 1) {
                return await interaction.editReply({ content: '❌ Quantidade de ganhadores deve ser um número inteiro positivo (ex: 1, 3).' });
            }

            // Encontrar o canal '🎁-sorteios' ou '🎁-sorteios-vip' dependendo do tipo
            const channelName = targetType === 'vip' ? '🎁-sorteios-vip' : '🎁-sorteios';
            const giveawayChannel = interaction.guild?.channels.cache.find((c: any) => c.name === channelName) as TextChannel;
            if (!giveawayChannel) {
                return await interaction.editReply({ content: `❌ Canal de destino (\`#${channelName}\`) não encontrado! Destrua e refaça o /setup se ele foi deletado manualmente.` });
            }

            const endsAt = new Date(Date.now() + timeMs);

            const hasImage = image && (image.startsWith('http://') || image.startsWith('https://'));
            let giveawayEmbed;

            // Monta o Card do Sorteio respeitando a identidade visual daquele destino
            if (targetType === 'vip') {
                const embedArgs: any = {
                    description: `**PREMIAÇÃO MAJESTOSA:**\n> 🎁 **${prize}**\n\n**INFORMAÇÕES:**\n🏆 **Vencedores:** \`${winnersCount}\`\n⏳ **Termina em:** <t:${Math.floor(endsAt.getTime() / 1000)}:R> (<t:${Math.floor(endsAt.getTime() / 1000)}:f>)\n👑 **Sorteio Patrocinado por:** <@${interaction.user.id}>\n\n**🚀 COMO PARTICIPAR?**\nPara entrar no sorteio, clique no botão para confirmar participação entre a Elite. Boa sorte!`,
                    author: { name: interaction.guild?.name || 'Administração', iconURL: interaction.guild?.iconURL() || 'https://cdn-icons-png.flaticon.com/512/3212/3212683.png' }
                };
                if (hasImage) embedArgs.image = image;
                giveawayEmbed = UI.vipMessageOfficial('GIVEAWAY DROP EXCLUSIVO! 🎉', embedArgs);
            } else {
                const embedArgs: any = {
                    description: `**PREMIAÇÃO MAJESTOSA:**\n> 🎁 **${prize}**\n\n**INFORMAÇÕES:**\n🏆 **Vencedores:** \`${winnersCount}\`\n⏳ **Termina em:** <t:${Math.floor(endsAt.getTime() / 1000)}:R> (<t:${Math.floor(endsAt.getTime() / 1000)}:f>)\n👑 **Sorteio Patrocinado por:** <@${interaction.user.id}>\n\n**🚀 COMO PARTICIPAR?**\nPara entrar no sorteio, clique no botão azul abaixo e comprove sua presença. Boa sorte!`,
                    color: 'primary',
                    author: { name: interaction.guild?.name || 'Administração', iconURL: interaction.guild?.iconURL() || 'https://cdn-icons-png.flaticon.com/512/3212/3212683.png' }
                };
                if (hasImage) embedArgs.image = image;
                giveawayEmbed = UI.announcementOfficial('GIVEAWAY DROP ATIVO! 🎉', embedArgs);
            }

            const joinStyle = targetType === 'vip' ? ButtonStyle.Secondary : ButtonStyle.Primary;
            const joinButton = new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder().setCustomId(`btn_join_giveaway|0`).setLabel('🎉 Participar do Sorteio (0 Participantes)').setStyle(joinStyle)
            );

            const sentMessage = await giveawayChannel.send({ embeds: [giveawayEmbed], components: [joinButton] });

            // Transição seguríssima: Salvar TUDO no banco de dados Neon
            await db.insert(giveaways).values({
                messageId: sentMessage.id, // O Bot usará este ID para editar a mensagem após finalizar 
                channelId: giveawayChannel.id,
                prize: prize,
                winnersCount: winnersCount,
                hostId: interaction.user.id,
                status: 'ACTIVE',
                rewardType: rewardType,
                rewardData: rewardData,
                endsAt: endsAt
            });

            // Re-configura o ID do botão de join para acoplar o messageId
            const customJoinButton = new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder().setCustomId(`btn_join_giveaway|${sentMessage.id}`).setLabel('🎉 Participar do Sorteio (0 Participantes)').setStyle(joinStyle)
            );
            await sentMessage.edit({ components: [customJoinButton] });

            AuditLogger.systemEvent('🎁 Sorteio Iniciado (Giveaways Engine)', `A Staff **${interaction.user.tag}** instanciou um Giveaway [${prize}] no canal <#${giveawayChannel.id}> para durar até ${endsAt.toISOString()}. ID: \`${sentMessage.id}\``);

            const successEmbed = UI.success('Máquina de Sorteio Ligada ✅', `O Giveaway para \`${prize}\` está ao-vivo em <#${giveawayChannel.id}>!`);
            await interaction.editReply({ embeds: [successEmbed] });

        } catch (error: any) {
            AuditLogger.error('Giveaway Modal Processing Failed', error?.message);
            await interaction.editReply({ content: '❌ Ocorreu um erro interno de Infraestrutura na tentativa de salvar este sorteio no NeonDB.' });
        }
    },
};

export default createGiveawayModal;
