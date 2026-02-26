import { MessageFlags, type ButtonInteraction } from 'discord.js';
import type { ComponentHandler } from '../../types/index.js';
import { AuditLogger } from '../../utils/logger.js';
import { UI } from '../../ui/embeds.js';

const acceptRulesButton: ComponentHandler<ButtonInteraction> = {
    id: 'btn_accept_rules',

    async execute(interaction) {
        if (!interaction.guild || !interaction.member) return;

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        try {
            const memberRole = interaction.guild.roles.cache.find(r => r.name === '🎮 Membro');

            if (!memberRole) {
                await interaction.editReply({ content: '❌ Ocorreu um erro na matriz do servidor. O cargo de membro não foi encontrado pela administração.' });
                return;
            }

            const member = await interaction.guild.members.fetch(interaction.user.id);

            if (member.roles.cache.has(memberRole.id)) {
                await interaction.editReply({ content: '✅ Você já aceitou as regras e é um Membro Oficial Sens-PUBG.' });
                return;
            }

            await member.roles.add(memberRole);

            const successEmbed = UI.success(
                'Bem-vindo à Comunidade Sens-PUBG',
                'O seu passaporte foi liberado! Você agora tem acesso total às galerias de mídias, chats gerais e hubes de voz autônomos. Jogue limpo e divirta-se.'
            );
            await interaction.editReply({ embeds: [successEmbed] });

            // Autodestruição da mensagem efêmera para não ficar entulhando a tela do usuário
            setTimeout(async () => {
                try { await interaction.deleteReply(); } catch (e) { }
            }, 10000);

        } catch (error: any) {
            AuditLogger.error('Failed to assign Member Role on Rules Panel', error?.message);
            await interaction.editReply({ content: '❌ Houve uma barreira de segurança ao te atribuir o cargo. Tente novamente mais tarde.' });
            setTimeout(async () => { try { await interaction.deleteReply(); } catch (e) { } }, 10000);
        }
    },
};

export default acceptRulesButton;
