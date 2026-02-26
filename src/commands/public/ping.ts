import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js';
import type { Command } from '../../types/index.js';
import { UI } from '../../ui/embeds.js';

const pingCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Retorna a latência atual do Bot (Sens-PUBG Monitor).'),
    async execute(interaction: ChatInputCommandInteraction) {
        // Send initial request to calculate latency
        const sent = await interaction.reply({ content: 'Pingando a Vercel/Neon...', fetchReply: true });

        const roundtrip = sent.createdTimestamp - interaction.createdTimestamp;
        const websocket = interaction.client.ws.ping;

        const embed = UI.premium('Monitoramento Sens-PUBG', {
            description: 'As conexões com Discord e Banco de Dados estão estaveis.',
            fields: [
                { name: '🏓 Latência Gateway', value: `\`${roundtrip}ms\``, inline: true },
                { name: '🌐 WebSockets', value: `\`${websocket}ms\``, inline: true },
            ]
        });

        await interaction.editReply({ content: '', embeds: [embed] });
    },
};

export default pingCommand;
