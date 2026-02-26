import { Events, Message } from 'discord.js';
import type { ClientEvent } from '../types/index.js';
import { db } from '../database/index.js';
import { userXp, users } from '../database/schema.js';
import { eq } from 'drizzle-orm';
import { AuditLogger } from '../utils/logger.js';
import { UI } from '../ui/embeds.js';

// As patentes Supremas Mapeadas pelo Nível do Jogador
const RANK_REWARDS = [
    { level: 5, roleName: '🔰 RECRUTA' },
    { level: 10, roleName: '🛡️ SOLDADO ATIVO' },
    { level: 20, roleName: '🎯 ESPECIALISTA' },
    { level: 30, roleName: '⚔️ SOBREVIVENTE ALPHA' },
    { level: 40, roleName: '🔫 ATIRADOR DE ELITE' },
    { level: 50, roleName: '🎖️ VETERANO DE GUERRA' },
    { level: 60, roleName: '🦅 ÁGUIA DE ELITE' },
    { level: 70, roleName: '🥇 LENDA VIVA' },
    { level: 80, roleName: '☠️ PREDADOR' },
    { level: 90, roleName: '🌟 GRANDMASTER PUBG' },
    { level: 100, roleName: '🏆 MESTRE SUPREMO' }
];

// O Coração da Progressão (Fórmula padrão MEE6: 5/6 * level * \u00b2 + 50 * level + 100)
function calculateXpForNextLevel(level: number): number {
    return Math.floor(5 / 6 * level * (2 * level * level + 27 * level + 91));
}

const messageCreateEvent: ClientEvent<Events.MessageCreate> = {
    name: Events.MessageCreate,
    once: false,
    async execute(message: Message) {
        // Ignora bots e mensagens fora de guidas
        if (message.author.bot || !message.guild) return;

        try {
            // Busca o usuário na Engine de XP
            const userData = await db.select().from(userXp).where(eq(userXp.userId, message.author.id)).limit(1);

            const now = new Date();
            let isNewUser = false;
            let currentXp = 0;
            let currentLevel = 1;
            let messagesSent = 0;
            let lastMessageAt = new Date(0); // Epoch 0

            if (userData.length === 0) {
                isNewUser = true;
            } else {
                currentXp = userData[0].xp;
                currentLevel = userData[0].level;
                messagesSent = userData[0].messagesSent;
                lastMessageAt = new Date(userData[0].lastMessageAt);
            }

            // --- SISTEMA ANTI-FARM (Cooldown de 60 Segundos por XP) ---
            const timeDiffSecs = (now.getTime() - lastMessageAt.getTime()) / 1000;
            if (!isNewUser && timeDiffSecs < 60) {
                // Não ganha XP (Spam bloqueado)
                return;
            }

            // Sorteia XP autêntico entre 15 e 25 por mensagem validada
            const xpGained = Math.floor(Math.random() * 11) + 15;
            currentXp += xpGained;
            messagesSent++;

            // Checa Level Up
            const xpNeeded = calculateXpForNextLevel(currentLevel);
            let leveledUp = false;

            if (currentXp >= xpNeeded) {
                currentLevel++;
                leveledUp = true;
                currentXp = currentXp - xpNeeded; // Rola o XP pra próxima barra
            }

            // Atualiza o Banco de Dados Cloud (Drizzle)
            if (isNewUser) {
                // Sincroniza com Tabela Master primeiro (Garante integridade referencial pro futuro)
                const existingMaster = await db.select().from(users).where(eq(users.id, message.author.id)).limit(1);
                if (existingMaster.length === 0) {
                    await db.insert(users).values({
                        id: message.author.id,
                        username: message.author.username,
                    });
                }

                await db.insert(userXp).values({
                    userId: message.author.id,
                    xp: currentXp,
                    level: currentLevel,
                    messagesSent: 1,
                    lastMessageAt: now
                });
            } else {
                await db.update(userXp)
                    .set({ xp: currentXp, level: currentLevel, messagesSent, lastMessageAt: now })
                    .where(eq(userXp.userId, message.author.id));
            }

            // Triggers de Visual e Patentes
            if (leveledUp) {
                // 1. Procura Cargo no Servidor que bate com o Nível
                const rankReward = RANK_REWARDS.find(r => r.level === currentLevel);
                if (rankReward) {
                    const roleToGive = message.guild.roles.cache.find(r => r.name === rankReward.roleName);
                    const member = await message.guild.members.fetch(message.author.id);
                    if (roleToGive && member) {
                        await member.roles.add(roleToGive);
                        AuditLogger.systemEvent('🎖️ Progressão de Patente', `O Jogador <@${message.author.id}> alcançou o **Level ${currentLevel}** e conquistou a Patente Suprema de [\`${rankReward.roleName}\`].`);
                    }
                }

                // 2. Anuncia na Sala de Level Up Glorious (Procuramos o canal Level-Up pelo nome)
                const levelUpChannel = message.guild.channels.cache.find(c => c.name.includes('level-up') && c.isTextBased()) as any;
                if (levelUpChannel) {
                    const embed = UI.dashboardPanel('🚀 LEVEL UP!', {
                        description: `Incrível, <@${message.author.id}>! Sua atividade constante te fez subir de patamar na comunidade!`,
                        color: 'info',
                        thumbnail: message.author.displayAvatarURL(),
                        fields: [
                            { name: 'Novo Level Alcançado', value: `🏆 **Nível ${currentLevel}**`, inline: true },
                            { name: 'Mensagens Validadas', value: `💬 ${messagesSent} mensagens autênticas.`, inline: true }
                        ]
                    });
                    await levelUpChannel.send({ content: `<@${message.author.id}>`, embeds: [embed] });
                }
            }
        } catch (err: any) {
            AuditLogger.error(`Erro Crítico na Engine de XP ao processar mensagem de ${message.author.tag}`, err?.message);
        }
    },
};

export default messageCreateEvent;
