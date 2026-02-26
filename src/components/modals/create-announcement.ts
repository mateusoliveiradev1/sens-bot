import { MessageFlags, type ModalSubmitInteraction, TextChannel } from 'discord.js';
import type { ComponentHandler } from '../../types/index.js';
import { UI } from '../../ui/embeds.js';
import { AuditLogger } from '../../utils/logger.js';

const announcementModal: ComponentHandler<ModalSubmitInteraction> = {
    // Usamos apemas o prefixo, pois o interactionCreate lida com dinâmica
    id: 'modal_anuncio',

    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        try {
            // Separa os metadados do ID (modal_anuncio|12345678|info)
            const parts = interaction.customId.split('|');
            const canalId = parts[1];
            const colorOption = parts[2] as 'info' | 'warning' | 'success' | 'error' | 'systemBuild';

            const title = interaction.fields.getTextInputValue('announce_title');
            const desc = interaction.fields.getTextInputValue('announce_desc');
            const image = interaction.fields.getTextInputValue('announce_image');

            const targetChannel = interaction.guild?.channels.cache.get(canalId) as TextChannel;
            if (!targetChannel) {
                const erroEmbed = UI.error('Falha Logística', 'O Canal de destino desapareceu ou não tenho permissão para vê-lo.');
                await interaction.editReply({ embeds: [erroEmbed] });
                return;
            }

            let dashEmbed;
            const hasImage = image && (image.startsWith('http://') || image.startsWith('https://'));

            // Verifica se a comunicação é para o Império VIP através da cor escolhida na ActionRow do /setup
            if (colorOption === 'systemBuild') {
                const embedArgs: any = {
                    description: desc,
                    author: { name: interaction.user.username, iconURL: interaction.user.displayAvatarURL() || 'https://cdn-icons-png.flaticon.com/512/831/831294.png' }
                };
                if (hasImage) embedArgs.image = image;
                dashEmbed = UI.vipMessageOfficial(title, embedArgs);
            } else {
                const embedArgs: any = {
                    description: desc,
                    color: colorOption,
                    author: { name: interaction.user.username, iconURL: interaction.user.displayAvatarURL() || 'https://cdn-icons-png.flaticon.com/512/831/831294.png' }
                };
                if (hasImage) embedArgs.image = image;
                dashEmbed = UI.announcementOfficial(title, embedArgs);
            }

            await targetChannel.send({ embeds: [dashEmbed] });

            // Sucesso!
            const successEmbed = UI.success('Anúncio Disparado', `A sua publicação foi enviada ao vivo para o canal <#${canalId}>.`);
            await interaction.editReply({ embeds: [successEmbed] });
            AuditLogger.systemEvent('📢 Novo Anúncio Supremo', `O administrador ${interaction.user.tag} publicou um mural no canal <#${canalId}>. Título original: \`${title}\``);

            // Apaga a mensagem efêmera de sucesso após 8 segundos para não poluir
            setTimeout(async () => {
                try { await interaction.deleteReply(); } catch (e) { }
            }, 8000);

        } catch (error: any) {
            AuditLogger.error('Failed to dispatch Supreme Announcement', error?.message);
            await interaction.editReply({ content: '❌ Ocorreu um erro interno ao criar as engrenagens de Anúncio. Verifique se o link da imagem é válido.' });
        }
    },
};

export default announcementModal;
