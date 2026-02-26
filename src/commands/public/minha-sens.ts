import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } from 'discord.js';
import type { Command } from '../../types/index.js';
import { UI } from '../../ui/embeds.js';
import { env } from '../../config/env.js';
import { AuditLogger } from '../../utils/logger.js';

const minhaSensCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('minha-sens')
        .setDescription('🔍 Visualiza a sua sensibilidade sincronizada no site Sens-PUBG.'),

    async execute(interaction) {
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

        try {
            // URL da API do site (Vercel)
            const siteUrl = 'https://sens-pubg.vercel.app';
            const response = await fetch(`${siteUrl}/api/bot/user/${interaction.user.id}`, {
                headers: {
                    'Authorization': `Bearer ${env.BOT_API_KEY}`,
                    'x-bot-api-key': env.BOT_API_KEY
                }
            });

            if (response.status === 404) {
                const noAccountEmbed = UI.error(
                    'Conta não Vinculada! 🔗',
                    'Não encontramos um perfil no site **Sens-PUBG** para a sua conta do Discord.\n\nPara visualizar sua sensibilidade aqui, você precisa:\n1. Logar no site via Discord.\n2. Configurar seu perfil de sensitividade.'
                );

                const loginButton = new ButtonBuilder()
                    .setLabel('Vincular no Sens-PUBG.com')
                    .setURL(siteUrl)
                    .setStyle(ButtonStyle.Link);

                const row = new ActionRowBuilder<ButtonBuilder>().addComponents(loginButton);

                return await interaction.editReply({ embeds: [noAccountEmbed], components: [row] });
            }

            if (!response.ok) {
                throw new Error(`Site API responded with status ${response.status}`);
            }

            const rawData = await response.json();

            // Handle structure: { user: {...}, profile: {...} }
            const user = rawData.user || {};
            const profile = rawData.profile || {};

            if (!profile || typeof profile !== 'object') {
                throw new Error('User profile data is missing or invalid in API response');
            }

            // Map specifically to the structure sent by the site
            const mouseName = profile.mouseName || 'Mouse Gamer Padrão';
            const mouseDpi = profile.mouseDpi || '0';
            const pollingRate = profile.pollingRate ? `${profile.pollingRate}Hz` : 'Desconhecido';
            const generalSens = profile.generalSens || '0';
            const adsSens = profile.adsSens || '0';
            const fov = profile.fov || '90';
            const multiplier = profile.verticalMultiplier || '1.0';

            const profileEmbed = UI.premium(`CARD DE PERFORMANCE: ${user.name || interaction.user.username}`, {
                description: `Sincronização biométrica completa via **Sens-PUBG DNA 🧬**\nDados extraídos diretamente do seu perfil de atleta.`
            });

            if (user.image) {
                profileEmbed.setThumbnail(user.image);
            } else {
                profileEmbed.setThumbnail(interaction.user.displayAvatarURL());
            }

            // Layout por Setores: Mouse & Config Base
            profileEmbed.addFields(
                { name: '🖱️ HARDWARE DE PRECISÃO', value: `> **Mouse:** \`${mouseName}\`\n> **DPI:** \`${mouseDpi}\`\n> **Polling:** \`${pollingRate}\``, inline: false },
                { name: '⚙️ CONFIGURAÇÕES BASE', value: `\`\`\`css\n[ GERAL: ${generalSens} ] [ ADS: ${adsSens} ] [ MULT. V: ${multiplier} ] [ FOV: ${fov} ]\n\`\`\``, inline: false }
            );

            // Setor de Miras (Escopos)
            const scopes = profile.scopeSens || {};
            const scopeField = [
                `🔭 **1x:** \`${scopes['1x'] || adsSens}\` | **2x:** \`${scopes['2x'] || adsSens}\` | **3x:** \`${scopes['3x'] || adsSens}\``,
                `🔭 **4x:** \`${scopes['4x'] || adsSens}\` | **6x:** \`${scopes['6x'] || adsSens}\``,
                `🔭 **8x:** \`${scopes['8x'] || adsSens}\` | **15x:** \`${scopes['15x'] || adsSens}\``
            ].join('\n');

            profileEmbed.addFields({ name: '🎯 SENSIBILIDADE DE ESCOPOS', value: scopeField, inline: false });

            profileEmbed.setFooter({
                text: 'Sens-PUBG.com • Otimização de Performance 24/7',
                iconURL: 'https://media.discordapp.net/attachments/1187422501099688047/1269006093738573906/sens_logo.png'
            });

            await interaction.editReply({ embeds: [profileEmbed] });

        } catch (error: any) {
            AuditLogger.error(`Failed to fetch user sens for ${interaction.user.tag}`, error?.message);
            await interaction.editReply({
                content: '❌ Ocorreu um erro ao tentar consultar a API do site. Verifique se o serviço está online ou tente novamente mais tarde.'
            });
        }
    },
};

export default minhaSensCommand;
