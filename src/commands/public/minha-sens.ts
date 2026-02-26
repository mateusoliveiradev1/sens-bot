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
                    'Authorization': `Bearer ${env.BOT_API_KEY}`
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
            const userData = rawData.profile || rawData;

            if (!userData || typeof userData !== 'object') {
                throw new Error('User profile data is missing or invalid in API response');
            }

            // Map specifically to the structure sent by the site
            const mouse = userData.mouseName || 'Configurado no Site';
            const dpi = userData.mouseDpi || '0';
            const sensitivity = userData.generalSens || '0';
            const fov = userData.fov || '90';
            const multiplier = userData.verticalMultiplier || '1.0';

            const profileEmbed = UI.premium(`Sua Sensibilidade: ${rawData.user?.name || interaction.user.username}`, {
                description: `Aqui estão os dados sincronizados diretamente do seu perfil na plataforma **Sens-PUBG**.`
            });

            if (rawData.user?.image) {
                profileEmbed.setThumbnail(rawData.user.image);
            } else {
                profileEmbed.setThumbnail(interaction.user.displayAvatarURL());
            }

            profileEmbed.addFields(
                { name: '🖱️ Mouse', value: `\`${mouse}\``, inline: true },
                { name: '🎯 DPI', value: `\`${dpi}\``, inline: true },
                { name: '🎮 Sens In-Game', value: `\`${sensitivity}\``, inline: true },
                { name: '📐 FOV', value: `\`${fov}\``, inline: true },
                { name: '↕️ Mult. Vertical', value: `\`${multiplier}\``, inline: true }
            );

            profileEmbed.setFooter({ text: 'Sincronizado via Sens-Bot DNA 🧬' });

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
