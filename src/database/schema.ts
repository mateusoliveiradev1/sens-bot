import { pgTable, text, timestamp, varchar, integer, real } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
    id: varchar('id', { length: 255 }).primaryKey(), // Discord User ID
    username: varchar('username', { length: 255 }).notNull(),
    joinedAt: timestamp('joined_at').defaultNow().notNull(),
    sensPubgUrl: text('sens_pubg_url'), // Link publico para perfil pessoal site
});

export const serverConfigs = pgTable('server_configs', {
    guildId: varchar('guild_id', { length: 255 }).primaryKey(),
    adminRoleId: varchar('admin_role_id', { length: 255 }),
    supportRoleId: varchar('support_role_id', { length: 255 }),
    auditChannelId: varchar('audit_channel_id', { length: 255 }),
    backupsChannelId: varchar('backups_channel_id', { length: 255 }),
    ticketPanelChannelId: varchar('ticket_panel_channel_id', { length: 255 }),
    setupComplete: timestamp('setup_complete'),
});

// Tabela Espelho da Plataforma Web Sens-PUBG para cache e acesso rápido
export const proPlayersCache = pgTable('pro_players_cache', {
    id: varchar('id', { length: 50 }).primaryKey(), // slug like 'beellz'
    name: varchar('name', { length: 100 }).notNull(),
    mouseName: varchar('mouse_name', { length: 255 }),
    dpi: integer('dpi'),
    pollingRate: integer('polling_rate'),
    inGameSens: real('in_game_sens'),
    fov: integer('fov'),
    verticalMultiplier: real('vertical_multiplier'),
    lastUpdated: timestamp('last_updated').defaultNow().notNull(),
});

// Tabela de rastreabilidade perpétua das ações do bot (Audit)
export const auditLogs = pgTable('audit_logs', {
    id: varchar('id', { length: 50 }).primaryKey(), // UUID
    level: varchar('level', { length: 20 }).notNull(), // INFO, ERROR, AUDIT, BACKUP, TICKET
    message: text('message').notNull(),
    errorDetails: text('error_details'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Tabela de tracking dos arquivos de backup do banco de dados (Para o Cron)
export const backupsHistory = pgTable('backups_history', {
    id: varchar('id', { length: 50 }).primaryKey(), // UUID
    fileName: varchar('file_name', { length: 255 }).notNull(),
    status: varchar('status', { length: 20 }).notNull(), // SUCCESS, FAILED
    fileSizeMb: real('file_size_mb'),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Tabela de tracking de Tickets de Suporte
export const supportTickets = pgTable('support_tickets', {
    id: varchar('id', { length: 255 }).primaryKey(), // ID do Canal gerado
    userId: varchar('user_id', { length: 255 }).notNull(), // Quem abriu
    reason: varchar('reason', { length: 1000 }).notNull(), // Duvida, Comercial, etc
    status: varchar('status', { length: 20 }).default('OPEN').notNull(), // OPEN, CLOSED
    resolutionNote: text('resolution_note'), // O que foi feito pela Staff
    createdAt: timestamp('created_at').defaultNow().notNull(),
    closedAt: timestamp('closed_at'),
});

// Engine Mestre de Progressão de Cargos e Status
export const userXp = pgTable('user_xp', {
    userId: varchar('user_id', { length: 255 }).primaryKey(),
    xp: integer('xp').default(0).notNull(),
    level: integer('level').default(1).notNull(),
    messagesSent: integer('messages_sent').default(0).notNull(),
    lastMessageAt: timestamp('last_message_at').defaultNow().notNull(), // Crucial para anti-spam
});

// Engine Mestre de Sorteios (Giveaways Interativos)
export const giveaways = pgTable('giveaways', {
    messageId: varchar('message_id', { length: 255 }).primaryKey(), // ID da Mensagem do Embed
    channelId: varchar('channel_id', { length: 255 }).notNull(),
    prize: varchar('prize', { length: 255 }).notNull(),
    winnersCount: integer('winners_count').notNull().default(1),
    hostId: varchar('host_id', { length: 255 }).notNull(), // Quem criou
    status: varchar('status', { length: 20 }).default('ACTIVE').notNull(), // ACTIVE, ENDED, CANCELLED
    rewardType: varchar('reward_type', { length: 50 }).notNull().default('MANUAL'), // MANUAL, ROLE, XP, DIGITAL
    rewardData: text('reward_data'), // ID Cargo, Valor XP, Códigos.
    endsAt: timestamp('ends_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const giveawayParticipants = pgTable('giveaway_participants', {
    giveawayId: varchar('giveaway_id', { length: 255 }).notNull(), // FK messageId
    userId: varchar('user_id', { length: 255 }).notNull(),
    joinedAt: timestamp('joined_at').defaultNow().notNull(),
});

// Tabela de Transcrições de Tickets (Historico de conversas)
export const ticketTranscripts = pgTable('ticket_transcripts', {
    id: varchar('id', { length: 50 }).primaryKey(), // UUID
    ticketId: varchar('ticket_id', { length: 255 }).notNull(), // FK supportTickets.id
    content: text('content').notNull(), // JSON stringificado com as msgs
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Tabela de Configuração do Painel de Ranking Automático
export const leaderboardConfigs = pgTable('leaderboard_configs', {
    guildId: varchar('guild_id', { length: 255 }).primaryKey(),
    channelId: varchar('channel_id', { length: 255 }).notNull(),
    messageId: varchar('message_id', { length: 255 }).notNull(),
    lastUpdated: timestamp('last_updated').defaultNow().notNull(),
});
