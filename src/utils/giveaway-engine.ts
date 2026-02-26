import { Client, TextChannel, EmbedBuilder } from 'discord.js';
import { db } from '../database/index.js';
import { giveaways, giveawayParticipants, userXp } from '../database/schema.js';
import { eq, and, lte } from 'drizzle-orm';
import { AuditLogger } from './logger.js';

export function startGiveawayEngine(client: Client) {
    AuditLogger.info('Giveaway Autonomous Engine is booting up...');

    // Roda a cada 60 segundos
    setInterval(async () => {
        try {
            const now = new Date();
            // Busca sorteios ativos que já expiraram
            const expiredGiveaways = await db.select().from(giveaways)
                .where(and(eq(giveaways.status, 'ACTIVE'), lte(giveaways.endsAt, now)));

            for (const giveaway of expiredGiveaways) {
                // Atualiza o status para ENDED para evitar múltiplas leituras em caso de gargalo
                await db.update(giveaways).set({ status: 'ENDED' }).where(eq(giveaways.messageId, giveaway.messageId));

                // Busca participantes
                const participants = await db.select().from(giveawayParticipants).where(eq(giveawayParticipants.giveawayId, giveaway.messageId));

                const channel = client.channels.cache.get(giveaway.channelId) as TextChannel;
                if (!channel) continue;

                try {
                    const message = await channel.messages.fetch(giveaway.messageId);

                    if (participants.length === 0) {
                        // Sem participantes
                        const embed = EmbedBuilder.from(message.embeds[0])
                            .setDescription(`**SORTEIO CANCELADO**\n\nPrêmio: **${giveaway.prize}**\n\nInfelizmente, ninguém participou da loteria e a janela expirou. 😢`)
                            .setColor(0x808080); // Cinza (System Muted)
                        await message.edit({ embeds: [embed], components: [] });
                        continue;
                    }

                    // Lógica de Shuffle Randômica (Sorteio justo)
                    const shuffled = participants.sort(() => 0.5 - Math.random());
                    const winners = shuffled.slice(0, giveaway.winnersCount);
                    const winnerMentions = winners.map(w => `<@${w.userId}>`).join(', ');
                    const isPlural = winners.length > 1;

                    // Altera a mensagem original do sorteio para mostrar os Ganhadores
                    const embed = EmbedBuilder.from(message.embeds[0])
                        .setDescription(`**🎉 DROP FINALIZADO 🎉**\n\nPrêmio: **${giveaway.prize}**\n👑 **${isPlural ? 'VENCEDORES GLORIOSOS' : 'VENCEDOR GLORIOSO'}:** ${winnerMentions}\n\n*A premiação foi executada pelo Motor de Sorteios da Sens-Bot App.*`)
                        .setColor(0x10B981); // Emerald Green Success
                    await message.edit({ embeds: [embed], components: [] });

                    // Distribui Prêmios Dinâmicos
                    const rewardType = giveaway.rewardType;
                    const rewardData = giveaway.rewardData;

                    if (rewardType === 'ROLE' && rewardData) {
                        const guild = channel.guild;
                        const roleIdStr = String(rewardData);
                        for (const winner of winners) {
                            try {
                                const member = await guild.members.fetch(winner.userId);
                                if (member) {
                                    await member.roles.add(roleIdStr);
                                    AuditLogger.systemEvent('👑 Entrega de Prêmio (ROLE)', `O cargo id \`${roleIdStr}\` foi injetado com sucesso em ${member.user.tag} pelo Auto-Engine.`);
                                }
                            } catch (e: any) {
                                AuditLogger.error(`Falha ao entregar recompensa ROLE para ${winner.userId}`, e instanceof Error ? e.stack : String(e));
                            }
                        }
                    } else if (rewardType === 'XP' && rewardData) {
                        const xpAmount = parseInt(rewardData) || 0;
                        for (const winner of winners) {
                            const userRecord = await db.select().from(userXp).where(eq(userXp.userId, winner.userId)).limit(1);
                            if (userRecord.length > 0) {
                                await db.update(userXp).set({ xp: userRecord[0].xp + xpAmount }).where(eq(userXp.userId, winner.userId));
                            } else {
                                await db.insert(userXp).values({ userId: winner.userId, xp: xpAmount, level: 1 });
                            }
                        }
                        AuditLogger.systemEvent('⚡ Entrega de Prêmio (XP)', `O valor de ${xpAmount} XP foi injetado na Base em ${winners.length} contas.`);
                    } else if (rewardType === 'DIGITAL' && rewardData) {
                        const keys = rewardData.split(',').map(k => k.trim());
                        for (let i = 0; i < winners.length; i++) {
                            const winner = winners[i];
                            const key = keys[i] || keys[0] || rewardData;
                            try {
                                const user = await client.users.fetch(winner.userId);
                                await user.send(`🎉 **PARABÉNS DA SENS-PUBG!** Você venceu o Sorteio de **${giveaway.prize}** na nossa comunidade Oficial do Robô!\n\n🔑 Sua Key de resgate Oculta / Código G-Coin é a seguinte:\n\`\`\`\n${key}\n\`\`\`\n> *Guarde-a com segurança ou ative imediatamente. Nosso robô de sorteios criptografará este dado da nossa base interna e ele sumirá para sempre.*`);
                            } catch (e: any) {
                                AuditLogger.error(`Muralha no DM: Impossivel mandar Key para ${winner.userId} (DMs fechadas).`, e instanceof Error ? e.stack : String(e));
                            }
                        }
                    }

                    // Mensagens Festivas Dinâmicas (UX Premium)
                    const conj = isPlural ? 'Vocês ganharam' : 'Você ganhou';
                    const pronoun = isPlural ? 'vocês' : 'você';

                    if (rewardType === 'MANUAL') {
                        await channel.send(`🎉 É isso ai ${winnerMentions}! ${conj} o drop de **${giveaway.prize}**!\n👉 **OPERAÇÃO MANUAL EXIGIDA:** ${isPlural ? 'Dirijam-se' : 'Dirija-se'} até a Central de Suporte e abram um Ticket Administrativo para requisitar o resgate deste prêmio!`);
                    } else if (rewardType === 'DIGITAL') {
                        await channel.send(`🎉 Parabéns ${winnerMentions}! ${conj} o sorteio majestoso **${giveaway.prize}**!\n🔑 O nosso autômato de segurança máxima acabou de despejar a **Key / Código Oculto** na DM (Chat Privado) de cada um de ${pronoun}! Corra conferir!`);
                    } else if (rewardType === 'XP') {
                        await channel.send(`⚡ BEM-VINDO(S) AO TOPO ${winnerMentions}! ${conj} a maleta de **${rewardData} XP**!\nOs Pontos Cósmicos já foram creditados magicamente no banco de dados nas contas de ${pronoun} pelo robô! Vão brilhar nos rankings!`);
                    } else if (rewardType === 'ROLE') {
                        await channel.send(`👑 Reverenciem aos novos soberanos ${winnerMentions}! A Automação Inteligente sorteou em favor de ${pronoun} o **${giveaway.prize}**!\n**Nossa Engenharia Cloud já engatou a Hierarquia (Cargo) direto nos perfis!** Desfrutem dos novos privilégios!`);
                    }

                } catch (err: any) {
                    AuditLogger.error(`Giveaway Finalization Exception for ${giveaway.messageId}`, err instanceof Error ? err.stack : String(err));
                }
            }
        } catch (error: any) {
            AuditLogger.error('Critical Engine Error inside Giveaway Engine Tick', error instanceof Error ? error.stack : String(error));
        }
    }, 60 * 1000); // Ticking a cada 60s
}
