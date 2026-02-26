import { randomUUID } from 'node:crypto';
import type { Client, TextChannel } from 'discord.js';
import { db } from '../database/index.js';
import { auditLogs, serverConfigs } from '../database/schema.js';
import { UI } from '../ui/embeds.js';

export class AuditLogger {
    private static discordClient: Client | null = null;
    private static auditChannelId: string | null = null;
    private static backupChannelId: string | null = null;

    static initialize(client: Client, auditId?: string, backupId?: string) {
        this.discordClient = client;
        if (auditId) this.auditChannelId = auditId;
        if (backupId) this.backupChannelId = backupId;
        this.info('AuditLogger initialized and attached to Discord Client.');
    }

    private static async persistLog(level: string, message: string, errorDetails?: string) {
        try {
            await db.insert(auditLogs).values({
                id: randomUUID(),
                level,
                message,
                errorDetails,
            });
        } catch (e: any) {
            // Silently swallow pure network timeouts to avoid console spamming
            const isTimeout = e?.message?.includes('fetch failed') || e?.cause?.name === 'ConnectTimeoutError';
            if (isTimeout) {
                console.warn(`\x1b[33m[WARN]\x1b[0m Neon DB Timeout ao salvar log (${level}). Ação cancelada.`);
            } else {
                console.error('Failed to write log to DB:', e?.message || e);
            }
        }
    }

    static info(message: string) {
        const timestamp = new Date().toISOString();
        console.log(`\x1b[36m[INFO]\x1b[0m [${timestamp}] ${message}`);
        this.persistLog('INFO', message);
    }

    static error(message: string, stack?: string) {
        const timestamp = new Date().toISOString();
        console.error(`\x1b[31m[ERROR]\x1b[0m [${timestamp}] ${message}`);
        if (stack) console.error(stack);

        this.persistLog('ERROR', message, stack);

        const embed = UI.dashboardPanel('❌ Falha Crítica do Sistema', {
            description: `**Log Engine Alert**\nUm erro fatal ocorreu e foi suprimido.`,
            color: 'error',
            fields: [
                { name: 'Mensagem', value: message },
                { name: 'Stack Trace', value: `\`\`\`ts\n${stack?.substring(0, 800) || 'Sem stack trace'}\n\`\`\`` }
            ]
        });

        this.dispatchToDiscord(this.auditChannelId, { embeds: [embed] });
    }

    static systemEvent(title: string, details: string, staffUser?: import('discord.js').User) {
        const timestamp = new Date().toISOString();
        console.log(`\x1b[33m[AUDIT]\x1b[0m [${timestamp}] ${title}: ${details}`);

        this.persistLog('AUDIT', `${title}: ${details}`);

        const embed = UI.dashboardPanel(`⚙️ ${title}`, {
            description: details,
            color: 'systemBuild',
            ...(staffUser && { author: { name: `Executado por: ${staffUser.username}`, iconURL: staffUser.displayAvatarURL() } })
        });

        this.dispatchToDiscord(this.auditChannelId, { embeds: [embed] });
    }

    static ticketCreated(ticketName: string, user: import('discord.js').User) {
        this.persistLog('AUDIT', `Ticket ${ticketName} Aberto por ${user.tag}`);

        const embed = UI.dashboardPanel(`🎫 Abertura de Ticket [#${ticketName}]`, {
            description: `Um novo chamado foi recebido e está aguardando Moderação.`,
            color: 'ticketOpen',
            thumbnail: user.displayAvatarURL(),
            fields: [
                { name: 'Solicitante', value: `<@${user.id}> (${user.tag})`, inline: true },
                { name: 'Status Inicial', value: '🟢 `OPEN`', inline: true }
            ]
        });

        this.dispatchToDiscord(this.auditChannelId, { embeds: [embed] });
    }

    static backup(message: string, isError = false) {
        const timestamp = new Date().toISOString();
        const prefix = isError ? '\x1b[31m[BACKUP ERROR]\x1b[0m' : '\x1b[32m[BACKUP]\x1b[0m';
        console.log(`${prefix} [${timestamp}] ${message}`);

        this.persistLog(isError ? 'BACKUP_ERROR' : 'BACKUP', message);

        const embed = UI.dashboardPanel(isError ? '❌ Falha de Backup' : '💾 Backup Automático Concluído', {
            description: message,
            color: isError ? 'error' : 'info'
        });

        this.dispatchToDiscord(this.backupChannelId, { embeds: [embed] });
    }

    static async memberJoined(member: import('discord.js').GuildMember) {
        const configs = await db.select().from(serverConfigs).limit(1);
        const welcomeId = configs[0]?.welcomeChannelId;
        if (!welcomeId) return;

        const embed = UI.dashboardPanel('🚀 NOVO RECRUTA DETECTADO', {
            description: `Seja bem-vindo ao **QG SENS-PUBG**, <@${member.id}>!\n\nVocê acaba de pousar na maior central de desempenho do PUBG. Para liberar o acesso total aos canais e squads, leia as diretrizes em <#${welcomeId}> (📖-regras) e aceite os termos.`,
            color: 'success',
            thumbnail: member.user.displayAvatarURL(),
            fields: [
                { name: 'Soldado', value: member.user.tag, inline: true },
                { name: 'ID', value: `\`${member.id}\``, inline: true }
            ]
        }).setImage('https://media.discordapp.net/attachments/1187422501099688047/1269006093738573906/sens_logo.png');

        this.dispatchToDiscord(welcomeId, { content: `<@${member.id}>`, embeds: [embed] });
        this.persistLog('AUDIT', `Membro ${member.user.tag} entrou no servidor.`);
    }

    static async memberLeft(member: import('discord.js').PartialGuildMember | import('discord.js').GuildMember) {
        const configs = await db.select().from(serverConfigs).limit(1);
        const leaveId = configs[0]?.leaveChannelId || this.auditChannelId;
        if (!leaveId) return;

        const embed = UI.dashboardPanel('🚨 BAIXA NO PELOTÃO', {
            description: `O usuário **${member.user?.tag || 'Desconhecido'}** abandonou a base.`,
            color: 'error',
            fields: [
                { name: 'ID do Usuário', value: `\`${member.id}\``, inline: true },
                { name: 'Status', value: '🔴 `DISCONNECTED`', inline: true }
            ]
        });

        if (member.user?.displayAvatarURL()) {
            embed.setThumbnail(member.user.displayAvatarURL());
        }

        this.dispatchToDiscord(leaveId, { embeds: [embed] });
        this.persistLog('AUDIT', `Membro ${member.user?.tag || member.id} saiu do servidor.`);
    }

    static ticketReport(channelName: string, originalReason: string, resolutionReason: string, staffUser: import('discord.js').User) {
        this.persistLog('TICKET_CLOSED', `Ticket ${channelName} fechado por ${staffUser.tag}`);

        const embed = UI.dashboardPanel(`🔒 Encerramento de Ticket [${channelName}]`, {
            description: `Este suporte foi finalizado permanentemente. A Transcrição visual está anexada abaixo.`,
            color: 'ticketClose',
            thumbnail: staffUser.displayAvatarURL(),
            author: { name: 'Audit: Action Resolved', iconURL: 'https://cdn-icons-png.flaticon.com/512/5610/5610944.png' },
            fields: [
                { name: '📝 Motivo da Abertura Original', value: `\`\`\`\n${originalReason}\n\`\`\``, inline: false },
                { name: '✅ Resolução Oficial (Desfecho)', value: `> **${resolutionReason}**`, inline: false },
                { name: 'Fechado/Tratado por', value: `<@${staffUser.id}>`, inline: true },
                { name: 'Status do Banco', value: '🔴 `CLOSED`', inline: true }
            ]
        });

        this.dispatchToDiscord(this.auditChannelId, { embeds: [embed] });
    }

    private static async dispatchToDiscord(channelId: string | null, content: any) {
        if (!this.discordClient || !channelId) return;
        try {
            const channel = await this.discordClient.channels.fetch(channelId) as TextChannel;
            if (channel && channel.isTextBased()) {
                await channel.send(content);
            }
        } catch (e) {
            console.error('Failed to dispatch log to Discord:', e);
        }
    }
}
