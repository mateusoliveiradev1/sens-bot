import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js';
import type { Command } from '../../types/index.js';
import { UI } from '../../ui/embeds.js';
import { db } from '../../database/index.js';
import { proPlayersCache } from '../../database/schema.js';
import { eq } from 'drizzle-orm';

const sensCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('sens')
        .setDescription('Busca a sensibilidade e configurações do mouse de um Pro-Player do Sens-PUBG.')
        .addStringOption(option =>
            option.setName('jogador')
                .setDescription('O nome do jogador (ex: beellz, tgltn, piroca)')
                .setRequired(true)
        ),

    async execute(interaction: ChatInputCommandInteraction) {
        const playerQuery = interaction.options.getString('jogador', true).toLowerCase();

        // Defer the reply as database/API calls might take > 3 seconds
        await interaction.deferReply();

        // Fetching from Neon Serverless via Drizzle ORM
        const [playerConfig] = await db.select().from(proPlayersCache).where(eq(proPlayersCache.id, playerQuery));

        if (!playerConfig) {
            const errorEmbed = UI.error('Jogador não encontrado!', `Não achamos configurações para \`${playerQuery}\` no banco de dados do site Sens-PUBG.`);
            await interaction.editReply({ embeds: [errorEmbed] });
            return;
        }

        const embed = UI.premium(`${playerConfig.name} - Sensibilidades PUBG`, {
            description: `Aqui estão as configurações exatas sincronizadas com o banco de dados oficial do site!`,
            fields: [
                { name: '🖱️ Hardware', value: `\`${playerConfig.mouseName || 'N/A'}\``, inline: false },
                { name: '🎯 DPI', value: `\`${playerConfig.dpi || 'N/A'}\``, inline: true },
                { name: '⚡ Polling Rate', value: `\`${playerConfig.pollingRate || 'N/A'}Hz\``, inline: true },
                { name: '🎮 Sens. Jogo', value: `\`${playerConfig.inGameSens || 'N/A'}\``, inline: true },
                { name: '📐 V-Sync Mnt.', value: `\`${playerConfig.verticalMultiplier || 'N/A'}\``, inline: true },
                { name: '👁️ FOV', value: `\`${playerConfig.fov || 'N/A'}\``, inline: true },
            ]
        });

        await interaction.editReply({ embeds: [embed] });
    },
};

export default sensCommand;
