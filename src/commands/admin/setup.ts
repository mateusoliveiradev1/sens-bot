import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits, SlashCommandBuilder, TextChannel, CategoryChannel, GuildChannel, MessageFlags, EmbedBuilder, type ChatInputCommandInteraction } from 'discord.js';
import type { Command } from '../../types/index.js';
import { UI } from '../../ui/embeds.js';
import { AuditLogger } from '../../utils/logger.js';
import { db } from '../../database/index.js';
import { serverConfigs, leaderboardConfigs } from '../../database/schema.js';

const setupCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('GOD-MODE: Constrói a arquitetura perfeita da Comunidade, apaga canais invasores e despacha Painéis.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild) return;
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        try {
            // --- 1. ROLOS (CARGOS) ---
            // A ordem aqui define a Hierarquia Visual (Do topo para baixo)
            const rolesToEnsure = [
                // --- CATEGORIA: STAFF ---
                { name: '╔════ STAFF SENS ════╗', color: 0x2f3136, perms: [], hoist: true, legacyNames: [] },
                { name: '👑 SENS | ADMINISTRADOR', color: 0x9333ea, perms: [PermissionFlagsBits.Administrator], hoist: true, legacyNames: ['Sens-Admin'] },
                { name: '🛡️ SENS | MODERADOR', color: 0x06b6d4, perms: [PermissionFlagsBits.ManageMessages, PermissionFlagsBits.MuteMembers, PermissionFlagsBits.KickMembers, PermissionFlagsBits.BanMembers], hoist: true, legacyNames: ['Sens-Moderador'] },
                { name: '🎧 SENS | SUPORTE', color: 0x3b82f6, perms: [PermissionFlagsBits.ManageMessages, PermissionFlagsBits.MuteMembers, PermissionFlagsBits.DeafenMembers], hoist: true, legacyNames: ['Sens-Support'] },

                // --- CATEGORIA: VIP ---
                { name: '╔═════ VIP SENS ═════╗', color: 0x2f3136, perms: [], hoist: true, legacyNames: ['╔═════ MEMBROS ═════╗'] },
                { name: '💎 VIP | APOIADOR', color: 0xfacc15, perms: [], hoist: true, legacyNames: ['💎 VIP / Apoiador'] },
                { name: '🎁 SORTEADO HONORÁRIO', color: 0xec4899, perms: [], hoist: true, legacyNames: ['🎁 Sorteado Honorário'] },

                // --- CATEGORIA: PATENTES ---
                { name: '╔════ PATENTES ═════╗', color: 0x2f3136, perms: [], hoist: true, legacyNames: [] },
                { name: '🏆 MESTRE SUPREMO', color: 0xd946ef, perms: [], hoist: true, legacyNames: ['🏆 Mestre Supremo', 'Mestre PUBG'] },
                { name: '🌟 GRANDMASTER PUBG', color: 0xa855f7, perms: [], hoist: true, legacyNames: ['🌟 Grandmaster PUBG', 'Pro Player'] },
                { name: '☠️ PREDADOR', color: 0xf87171, perms: [], hoist: true, legacyNames: ['☠️ Predador'] },
                { name: '🥇 LENDA VIVA', color: 0xfbbf24, perms: [], hoist: true, legacyNames: ['🥇 Lenda Viva'] },
                { name: '🦅 ÁGUIA DE ELITE', color: 0xf59e0b, perms: [], hoist: true, legacyNames: ['🦅 Águia de Elite'] },
                { name: '🎖️ VETERANO DE GUERRA', color: 0xeab308, perms: [], hoist: true, legacyNames: ['🎖️ Veterano de Guerra'] },
                { name: '🔫 ATIRADOR DE ELITE', color: 0x84cc16, perms: [], hoist: true, legacyNames: ['🔫 Atirador de Elite'] },
                { name: '⚔️ SOBREVIVENTE ALPHA', color: 0x22c55e, perms: [], hoist: true, legacyNames: ['⚔️ Sobrevivente Alpha'] },
                { name: '🎯 ESPECIALISTA', color: 0x10b981, perms: [], hoist: true, legacyNames: ['🎯 Especialista'] },
                { name: '🛡️ SOLDADO ATIVO', color: 0x0ea5e9, perms: [], hoist: true, legacyNames: ['🛡️ Soldado Ativo'] },
                { name: '🔰 RECRUTA', color: 0x64748b, perms: [], hoist: true, legacyNames: ['🔰 Recruta'] },

                // --- CATEGORIA: COMUNIDADE ---
                { name: '╔════ COMUNIDADE ═════╗', color: 0x2f3136, perms: [], hoist: true, legacyNames: [] },
                { name: '🎮 MEMBRO COMUM', color: 0x9ca3af, perms: [], hoist: true, legacyNames: ['🎮 Membro', 'Membro'] },

                // --- CATEGORIA: SISTEMA ---
                { name: '╔═════ SISTEMA ═════╗', color: 0x2f3136, perms: [], hoist: true, legacyNames: [] },
                { name: '🤖 SENS | SISTEMA', color: 0x34d399, perms: [PermissionFlagsBits.Administrator], hoist: true, legacyNames: [] },
                { name: '🔇 MUTADO (AUTOMOD)', color: 0x1f2937, perms: [], hoist: true, legacyNames: ['🔇 Mutado Automod'] }
            ];

            const createdRoles: Record<string, string> = {};

            // Mapeia e Cria/Atualiza cargos
            for (const r of rolesToEnsure) {
                let role = interaction.guild.roles.cache.find(role => role.name === r.name);

                if (!role && r.legacyNames.length > 0) {
                    role = interaction.guild.roles.cache.find(role => r.legacyNames.includes(role.name));
                }

                if (!role) {
                    role = await interaction.guild.roles.create({
                        name: r.name,
                        color: r.color,
                        permissions: r.perms as any,
                        hoist: r.hoist,
                        reason: 'Sens-Bot Architecture Setup',
                    });
                } else {
                    await role.edit({
                        name: r.name,
                        color: r.color,
                        hoist: r.hoist,
                        reason: 'Sens-Bot Architecture Sync'
                    });
                }
                createdRoles[r.name] = role.id;

                if (r.name === '🤖 SENS | SISTEMA' && interaction.client.user) {
                    const self = await interaction.guild.members.fetch(interaction.client.user.id);
                    if (!self.roles.cache.has(role.id)) await self.roles.add(role.id);
                }

                // Se for o cargo de Admin Supremo, garante que o DONO do servidor o tenha
                if (r.name === '👑 SENS | ADMINISTRADOR' && interaction.guild.ownerId) {
                    try {
                        const owner = await interaction.guild.members.fetch(interaction.guild.ownerId);
                        if (owner && !owner.roles.cache.has(role.id)) {
                            await owner.roles.add(role.id);
                        }
                    } catch (e) {
                        AuditLogger.error('Failed to auto-assign Admin role to Owner', String(e));
                    }
                }
            }

            // --- 2. POSICIONAMENTO FORÇADO (Sincronização de Sidebar) ---
            try {
                // Filtra apenas cargos que o bot CONSEGUE mover (abaixo do topo dele)
                const botHighestRole = interaction.guild.members.me?.roles.highest.position || 0;

                const rolePositions = rolesToEnsure
                    .map((r, index) => {
                        const role = interaction.guild?.roles.cache.get(createdRoles[r.name]);
                        return {
                            role,
                            targetPosition: rolesToEnsure.length - index
                        };
                    })
                    .filter(rp => {
                        if (!rp.role) return false;
                        // O bot só pode mover quem está ABAIXO dele E para uma posição ABAIXO dele
                        return rp.role.position < botHighestRole && rp.targetPosition < botHighestRole;
                    })
                    .map(rp => ({ role: rp.role!.id, position: rp.targetPosition }));

                if (rolePositions.length > 0) {
                    await interaction.guild.roles.setPositions(rolePositions);
                } else if (rolesToEnsure.length > 0) {
                    console.warn('[WARN] O Bot está em uma posição muito baixa na hierarquia para organizar os cargos automaticamente.');
                }
            } catch (e) {
                AuditLogger.error('Hierarchy Sync Failed (Permission issues)', String(e));
                // Não trava o processo, apenas loga
            }

            // --- 3. LIMPEZA DE CARGOS ÓRFÃOS ---
            const allLegacyNames = rolesToEnsure.flatMap(r => r.legacyNames);
            const managedIds = Object.values(createdRoles);

            for (const role of interaction.guild.roles.cache.values()) {
                if (allLegacyNames.includes(role.name) && !managedIds.includes(role.id)) {
                    try {
                        // Verifica se o bot pode deletar (hierarquia)
                        if (role.position < (interaction.guild.members.me?.roles.highest.position || 0)) {
                            await role.delete('Migration Cleanup');
                        }
                    } catch { }
                }
            }

            const adminRoleId = createdRoles['👑 SENS | ADMINISTRADOR'];
            const modRoleId = createdRoles['🛡️ SENS | MODERADOR'];
            const supportRoleId = createdRoles['🎧 SENS | SUPORTE'];
            const membroRoleId = createdRoles['🎮 MEMBRO COMUM'];
            const vipRoleId = createdRoles['💎 VIP | APOIADOR'];

            const officialArchitecture: Array<{
                category: string;
                channels: Array<{
                    name: string;
                    type: ChannelType;
                    isPublicRead?: boolean;
                    noWrite?: boolean;
                    membersOnly?: boolean;
                    vipOnly?: boolean;
                    adminOnly?: boolean;
                    adminModOnly?: boolean;
                    staffOnly?: boolean;
                    userLimit?: number;
                }>;
            }> = [
                    {
                        category: '📌 PORTARIA DE ONBOARDING',
                        channels: [
                            { name: '👋-bem-vindo', type: ChannelType.GuildText, isPublicRead: true, noWrite: true },
                            { name: '📖-regras', type: ChannelType.GuildText, isPublicRead: true, noWrite: true }
                        ]
                    },
                    {
                        category: '📢 MURAIS INFORMATIVOS',
                        channels: [
                            { name: '📢-anuncios', type: ChannelType.GuildText, isPublicRead: true, noWrite: true },
                            { name: '📅-eventos-e-camp', type: ChannelType.GuildText, isPublicRead: true, noWrite: true },
                            { name: '🎁-sorteios', type: ChannelType.GuildText, isPublicRead: true, noWrite: true },
                            { name: '🎯-consultar-sens', type: ChannelType.GuildText, isPublicRead: true, noWrite: true }
                        ]
                    },
                    {
                        category: '🎫 CENTRAL DE ATENDIMENTO',
                        channels: [
                            { name: '📩-suporte', type: ChannelType.GuildText, isPublicRead: true, noWrite: true }
                        ]
                    },
                    {
                        category: '🏆 HALL DA FAMA',
                        channels: [
                            { name: '🏆-hall-da-fama', type: ChannelType.GuildText, isPublicRead: true, noWrite: true }
                        ]
                    },
                    {
                        category: '💬 ZONA DA COMUNIDADE',
                        channels: [
                            { name: '💬-chat-geral', type: ChannelType.GuildText, membersOnly: true },
                            { name: '📸-midias', type: ChannelType.GuildText, membersOnly: true },
                            { name: '🏆-melhores-jogadas', type: ChannelType.GuildText, membersOnly: true },
                            { name: '📈-level-up', type: ChannelType.GuildText, isPublicRead: true, noWrite: true },
                            { name: '🤖-comandos-lixo', type: ChannelType.GuildText, membersOnly: true },
                            { name: '🎮-procuro-squad', type: ChannelType.GuildText, membersOnly: true },
                            { name: '🎮-procuro-duo', type: ChannelType.GuildText, membersOnly: true }
                        ]
                    },
                    {
                        category: '🔊 SENS VOICE HUBS',
                        channels: [
                            { name: '🎙️-bate-papo-casual', type: ChannelType.GuildVoice, membersOnly: true },
                            { name: '➕-criar-squad', type: ChannelType.GuildVoice, membersOnly: true },
                            { name: '➕-criar-duo', type: ChannelType.GuildVoice, membersOnly: true, userLimit: 2 }
                        ]
                    },
                    {
                        category: '💎 ÁREA VIP EXCLUSIVA',
                        channels: [
                            { name: '💎-chat-vip', type: ChannelType.GuildText, vipOnly: true },
                            { name: '🎁-sorteios-vip', type: ChannelType.GuildText, vipOnly: true, noWrite: true },
                            { name: '➕-criar-sala-vip', type: ChannelType.GuildVoice, vipOnly: true }
                        ]
                    },
                    {
                        category: '🗄️ STAFF SENS-PUBG',
                        channels: [
                            { name: '🛠️-staff-chat', type: ChannelType.GuildText, staffOnly: true },
                            { name: '🗣️-reunioes-pauta', type: ChannelType.GuildText, staffOnly: true },
                            { name: '🔊-staff-voice-1', type: ChannelType.GuildVoice, staffOnly: true },
                            { name: '🔊-staff-voice-2', type: ChannelType.GuildVoice, staffOnly: true }
                        ]
                    },
                    {
                        category: '🛡️ ADMIN & SECURITY',
                        channels: [
                            { name: '📜-audit-logs', type: ChannelType.GuildText, adminModOnly: true },
                            { name: '💾-backups-db', type: ChannelType.GuildText, adminOnly: true },
                            { name: '🛡️-discord-security', type: ChannelType.GuildText, adminModOnly: true },
                            { name: '🔄-discord-updates', type: ChannelType.GuildText, adminModOnly: true }
                        ]
                    },
                    {
                        category: '⚙️ CENTRAL DE CONTROLE',
                        channels: [
                            { name: '📣-painel-anuncios', type: ChannelType.GuildText, adminOnly: true },
                            { name: '🎁-painel-sorteios', type: ChannelType.GuildText, adminOnly: true }
                        ]
                    },
                    {
                        category: '💤 AFK ZONE',
                        channels: [
                            { name: '💤-afk', type: ChannelType.GuildVoice, isPublicRead: true, noWrite: true }
                        ]
                    }
                ];

            const allowedCategoryNames = officialArchitecture.map(c => c.category);

            // --- 3. THE PURGE (AUTO-CLEANUP / IDEMPOTÊNCIA) ---
            const allChannels = await interaction.guild.channels.fetch();
            for (const [, channel] of allChannels) {
                if (!channel) continue;
                // Protection against auto-suicide causing 10008 Error Unknown Message
                if (channel.id === interaction.channelId) continue;
                // Don't delete tickets and dynamics (⛺ e 👑)
                if (channel.name.startsWith('ticket-') || channel.name.startsWith('⛺') || channel.name.startsWith('👑')) continue;

                if (channel.type === ChannelType.GuildCategory) {
                    if (!allowedCategoryNames.includes(channel.name)) {
                        await channel.delete().catch(() => { });
                    }
                } else {
                    // Check if it's strictly in the architecture
                    const expectedBlock = officialArchitecture.find(b => b.channels.some(c => c.name === channel.name));

                    if (!expectedBlock) {
                        // Not an official channel, delete it
                        await channel.delete().catch(() => { });
                    } else {
                        // It IS an official channel by name, BUT does it belong to the correct category?
                        // If it has no category, or wrong category name, nuke it so the Builder can recreate it properly.
                        const parentCategory = channel.parentId ? interaction.guild.channels.cache.get(channel.parentId) : null;
                        if (!parentCategory || parentCategory.name !== expectedBlock.category) {
                            await channel.delete().catch(() => { });
                        }
                    }
                }
            }

            // --- 4. THE BUILDER (RECONSTRUÇÃO) ---
            const builtChannels: Record<string, string> = {};

            let categoryPositionIndex = 0;

            for (const block of officialArchitecture) {
                // Find or Create Category
                let category = interaction.guild.channels.cache.find(c => c.name === block.category && c.type === ChannelType.GuildCategory) as CategoryChannel;

                if (!category) {
                    const overwrites: any[] = [
                        { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] }, // @everyone hide by default
                        { id: adminRoleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels] },
                        { id: interaction.client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels] }
                    ];

                    const isSecretCategory = [
                        '💎 ÁREA VIP EXCLUSIVA', '🗄️ STAFF SENS-PUBG', '🛡️ ADMIN & SECURITY', '⚙️ CENTRAL DE CONTROLE'
                    ].includes(block.category);

                    if (!isSecretCategory) {
                        // All other categories can be seen by everyone natively (unless restricted per channel)
                        overwrites.push({ id: interaction.guild.id, allow: [PermissionFlagsBits.ViewChannel] });
                    }

                    category = await interaction.guild.channels.create({
                        name: block.category,
                        type: ChannelType.GuildCategory,
                        permissionOverwrites: overwrites,
                        position: categoryPositionIndex
                    });
                } else {
                    // Update exact category positioning
                    await category.setPosition(categoryPositionIndex).catch(() => { });
                }

                categoryPositionIndex++;
                let channelPositionIndex = 0;

                for (const ch of block.channels) {
                    let channel = interaction.guild.channels.cache.find(c => c.name === ch.name && c.parentId === category.id) as GuildChannel;

                    const overwrites: any[] = [];
                    // Default everyone settings per channel logic
                    let everyoneView = true;

                    if (ch.adminOnly) {
                        everyoneView = false;
                        overwrites.push({ id: adminRoleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.Connect] });
                    } else if (ch.adminModOnly) {
                        everyoneView = false;
                        overwrites.push({ id: adminRoleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.Connect] });
                        overwrites.push({ id: modRoleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.Connect] });
                    } else if (ch.staffOnly) {
                        everyoneView = false;
                        overwrites.push({ id: adminRoleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.Connect] });
                        overwrites.push({ id: modRoleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.Connect] });
                        overwrites.push({ id: supportRoleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.Connect] });
                    } else if (ch.vipOnly) {
                        everyoneView = false;
                        const vipWriteConfig: bigint[] = ch.noWrite ? [] : [PermissionFlagsBits.SendMessages, PermissionFlagsBits.Connect];
                        overwrites.push({ id: vipRoleId, allow: [PermissionFlagsBits.ViewChannel, ...vipWriteConfig] });
                        overwrites.push({ id: adminRoleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.Connect] });
                    } else if (ch.membersOnly) {
                        overwrites.push({ id: membroRoleId, allow: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.Connect] });
                        overwrites.push({ id: interaction.guild.id, deny: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.Connect] });
                    } else if (ch.noWrite) {
                        overwrites.push({ id: interaction.guild.id, deny: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.Connect] });
                    }

                    if (!everyoneView) {
                        overwrites.push({ id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] });
                    } else {
                        // explicitly allow view channel for visual structure guarantee
                        overwrites.push({ id: interaction.guild.id, allow: [PermissionFlagsBits.ViewChannel] });
                    }

                    // Bot always has power
                    overwrites.push({ id: interaction.client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels, PermissionFlagsBits.Connect] });

                    if (!channel) {
                        const createParams: any = {
                            name: ch.name,
                            type: ch.type,
                            parent: category.id,
                            permissionOverwrites: overwrites,
                            position: channelPositionIndex
                        };
                        if (ch.type === ChannelType.GuildVoice && ch.userLimit) {
                            createParams.userLimit = ch.userLimit;
                        }
                        channel = await interaction.guild.channels.create(createParams);
                    } else {
                        // Ensure it's in the right category, sync perms, and position
                        const editParams: any = {
                            parent: category.id,
                            permissionOverwrites: overwrites,
                            position: channelPositionIndex
                        };
                        if (ch.type === ChannelType.GuildVoice && ch.userLimit) {
                            editParams.userLimit = ch.userLimit;
                        }

                        // Avoid unnecessary API calls if possible, but for idempotency we force edit
                        await channel.edit(editParams).catch(() => { });
                    }

                    channelPositionIndex++;

                    builtChannels[ch.name] = channel.id;
                }
            }

            // --- 5. NATIVE AFK CHANNEL SETUP ---
            const afkChannelId = builtChannels['💤-afk'];
            if (afkChannelId) {
                await interaction.guild.setAFKChannel(afkChannelId);
                await interaction.guild.setAFKTimeout(900); // 15 Minutos
            }

            // --- 6. DISPATCHING PERMANENT MESSAGES (PANELS) ---

            // 6.1 Bem-Vindo
            const welcomeChannel = interaction.guild.channels.cache.get(builtChannels['👋-bem-vindo']) as TextChannel;
            if (welcomeChannel && (await welcomeChannel.messages.fetch({ limit: 1 })).size === 0) {
                const embed = UI.dashboardPanel('🚀 QG SENS-PUBG', {
                    description: 'Você acaba de pousar na **Central Oficial de Desempenho e Network do PUBG**.\n\nNossa comunidade abriga desde novatos curiosos a Lendas Vivas do cenário competitivo mundial. Prepare sua mira e aproveite o conteúdo.',
                    color: 'info',
                    thumbnail: interaction.guild.iconURL() || 'https://media.discordapp.net/attachments/1187422501099688047/1269006093738573906/sens_logo.png'
                }).setImage('https://media.discordapp.net/attachments/1187422501099688047/1269006093738573906/sens_logo.png');
                await welcomeChannel.send({ embeds: [embed] });
            }

            // 6.2 Regras Panel
            const rulesChannel = interaction.guild.channels.cache.get(builtChannels['📖-regras']) as TextChannel;
            if (rulesChannel && (await rulesChannel.messages.fetch({ limit: 1 })).size === 0) {
                const rulesEmbed = UI.dashboardPanel('⚖️ CONSTITUIÇÃO DO SERVIDOR', {
                    description: 'O seu passaporte VIP está aguardando liberação.\n\nPara desbloquear todos os canais de texto e salas de voz, você precisa se comprometer com nossas **3 Leis Absolutas**:\n\n**1.** 🚫 Tolerância zero para Racismo, Xenofobia, Machismo ou qualquer tipo de preconceito (Banimento Direto).\n**2.** 🚫 Proibido flood, spam de invites ou links suspeitos de Phishing.\n**3.** 🤝 Respeito mútuo é exigido. Não estrague o jogo do próximo.\n\n`Clique no botão verde logo abaixo para aceitar a constituição e receber a Tag.`',
                    color: 'systemBuild',
                    thumbnail: 'https://cdn-icons-png.flaticon.com/512/3268/3268579.png' // Police shield
                });
                const accBtn = new ActionRowBuilder<ButtonBuilder>().addComponents(
                    new ButtonBuilder().setCustomId('btn_accept_rules').setLabel('Assinar e Receber Passaporte ✅').setStyle(ButtonStyle.Success)
                );
                await rulesChannel.send({ embeds: [rulesEmbed], components: [accBtn] });
            }

            // 6.3 Ticket Panel
            const supportChannel = interaction.guild.channels.cache.get(builtChannels['📩-suporte']) as TextChannel;
            if (supportChannel && (await supportChannel.messages.fetch({ limit: 1 })).size === 0) {
                const ticketEmbed = UI.dashboardPanel('🚑 ASSISTÊNCIA TÁTICA E SUPORTE', {
                    description: 'Nossa equipe de Curadores e Admins está de prontidão para ajudar.\n\n🔸 **Problemas com VIP** ou pagamentos.\n🔸 **Denúncias** pesadas de jogadores (com provas gravadas).\n🔸 **Dúvidas técnicas** ou Comerciais (Parcerias).\n\n`Seu ticket será 100% sigiloso e apenas você e a Administração poderão lê-lo.`',
                    color: 'ticketOpen',
                    thumbnail: 'https://cdn-icons-png.flaticon.com/512/10061/10061730.png' // Support headset
                });
                const tRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
                    new ButtonBuilder().setCustomId('btn_open_ticket').setLabel('Solicitar Extração (Criar Ticket) 🚁').setStyle(ButtonStyle.Primary)
                );
                await supportChannel.send({ embeds: [ticketEmbed], components: [tRow] });
            }

            // 6.4 Sens Fetcher Panel
            const sensChannel = interaction.guild.channels.cache.get(builtChannels['🎯-consultar-sens']) as TextChannel;
            if (sensChannel && (await sensChannel.messages.fetch({ limit: 1 })).size === 0) {
                const sensEmbed = UI.dashboardPanel('🧠 TERMINAL NEURAL SENS-PUBG', {
                    description: 'Seja bem-vindo ao Banco de Dados Global.\n\nConsulte instantaneamente as configurações privadas (DPI, Sensibilidade, FOV e Multiplicadores) dos **Melhores Jogadores Profissionais do Planeta**.\n\n`Nenhuma busca sua fica registrada publicamente neste laboratório.`',
                    color: 'info',
                    thumbnail: 'https://cdn-icons-png.flaticon.com/512/11267/11267869.png' // CPU / Tech
                });
                const sRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
                    new ButtonBuilder().setCustomId('btn_search_sens').setLabel('Injetar Busca no Banco de Dados 🔍').setStyle(ButtonStyle.Secondary)
                );
                await sensChannel.send({ embeds: [sensEmbed], components: [sRow] });
            }

            // 6.5 Aux Panels (Level Up)
            const levelChannel = interaction.guild.channels.cache.get(builtChannels['📈-level-up']) as TextChannel;
            if (levelChannel && (await levelChannel.messages.fetch({ limit: 1 })).size === 0) {
                const lEmbed = UI.dashboardPanel('🎖️ CORREDOR DA FAMA (RANKING)', {
                    description: 'A Engine de XP recompensa os soldados mais engajados da nossa base.\n\nGanhe XP conversando na comunidade para subir de Recruta até a glória da patente de **🏆 Mestre Supremo**!',
                    color: 'info',
                    thumbnail: 'https://cdn-icons-png.flaticon.com/512/5403/5403485.png'
                });
                await levelChannel.send({ embeds: [lEmbed] });
            }

            // 6.5.1 LEADERBOARD AUTOMÁTICO (CANAL EXCLUSIVO)
            const hallChannel = interaction.guild.channels.cache.get(builtChannels['🏆-hall-da-fama']) as TextChannel;
            if (hallChannel && (await hallChannel.messages.fetch({ limit: 1 })).size === 0) {
                const hEmbed = UI.dashboardPanel('🏆 HALL DA FAMA: TOP 10 SENS-PUBG', {
                    description: '⌛ Inicializando Hall da Fama...\n*O painel de ranking será sincronizado em instantes pelo motor automático.*',
                    color: 'info',
                    thumbnail: 'https://cdn-icons-png.flaticon.com/512/3112/3112946.png'
                });

                const leaderboardMsg = await hallChannel.send({ embeds: [hEmbed] });

                // Registra o painel no banco para o job automático
                await db.insert(leaderboardConfigs).values({
                    guildId: interaction.guild.id,
                    channelId: hallChannel.id,
                    messageId: leaderboardMsg.id,
                }).onConflictDoUpdate({
                    target: leaderboardConfigs.guildId,
                    set: {
                        channelId: hallChannel.id,
                        messageId: leaderboardMsg.id,
                        lastUpdated: new Date()
                    }
                });
            }

            // 6.6 AVISOS: Mural Público de Sorteios
            const sorteioChannel = interaction.guild.channels.cache.get(builtChannels['🎁-sorteios']) as TextChannel;
            if (sorteioChannel && (await sorteioChannel.messages.fetch({ limit: 1 })).size === 0) {
                const sEmbed = UI.dashboardPanel('🎁 CAIXAS DE SUPRIMENTOS (SORTEIOS)', {
                    description: 'Fique atento a este canal! É aqui que a Administração realizará **Sorteios de VIPs, Keys e Prêmios Exclusivos**.\n\nQuando um Drop estiver ativo, o Card surgirá aqui automaticamente.',
                    color: 'warning',
                    thumbnail: 'https://cdn-icons-png.flaticon.com/512/3212/3212683.png'
                });
                await sorteioChannel.send({ embeds: [sEmbed] });
            }

            // 6.7 CENTRAL GERAL DE ANÚNCIOS E SORTEIOS (Apenas Admins vêm os botões)
            const painelAnunciosChannel = interaction.guild.channels.cache.get(builtChannels['📣-painel-anuncios']) as TextChannel;
            if (painelAnunciosChannel && (await painelAnunciosChannel.messages.fetch({ limit: 1 })).size === 0) {
                const staffEmbed = new EmbedBuilder()
                    .setTitle('📡 TERMINAL GLOBAL DE TRANSMISSÃO')
                    .setDescription('```css\n[ SISTEMA DE COMUNICAÇÃO OFICIAL SENS-PUBG ]\n```\nUtilize este terminal blindado para publicar comunicados profissionais que serão disparados por toda a comunidade.\n\n### 🛡️ Nível de Acesso\n`Apenas Administradores Globais` possuem permissão para tocar neste painel. Suas mensagens sairão com formatação de App Autorizado.\n\n### ⚙️ Como Operar\nEscolha a região de destino nos botões abaixo. O sistema abrirá um formulário solicitando o **Título**, **Texto** e a **URL da Imagem** (opcional).')
                    .setColor(0x8b5cf6) // systemBuild Violet
                    .setImage('https://media.discordapp.net/attachments/1187422501099688047/1269006093738573906/sens_logo.png')
                    .setThumbnail('https://cdn-icons-png.flaticon.com/512/3268/3268579.png');
                const staffRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
                    new ButtonBuilder().setCustomId(`btn_announce|${builtChannels['📢-anuncios']}|info`).setLabel('📢 Anúncio Global').setStyle(ButtonStyle.Primary),
                    new ButtonBuilder().setCustomId(`btn_announce|${builtChannels['📅-eventos-e-camp']}|warning`).setLabel('📅 Camps e Vagas').setStyle(ButtonStyle.Success),
                    new ButtonBuilder().setCustomId(`btn_announce|${builtChannels['💎-chat-vip']}|systemBuild`).setLabel('💎 Mensagem VIP').setStyle(ButtonStyle.Secondary)
                );
                await painelAnunciosChannel.send({ embeds: [staffEmbed], components: [staffRow] });
            }

            const painelSorteiosChannel = interaction.guild.channels.cache.get(builtChannels['🎁-painel-sorteios']) as TextChannel;
            if (painelSorteiosChannel && (await painelSorteiosChannel.messages.fetch({ limit: 1 })).size === 0) {
                const sorteioStaffEmbed = UI.dashboardPanel('🎁 CENTRAL DE SORTEIOS (GIVEAWAYS)', {
                    description: 'Configure e gerencie todos os sorteios de chaves e benefícios da comunidade.\n\nClique no botão abaixo para preencher o formulário do próximo Drop.',
                    color: 'warning',
                    thumbnail: 'https://cdn-icons-png.flaticon.com/512/3212/3212683.png'
                });
                const sorteioRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
                    new ButtonBuilder().setCustomId('btn_create_giveaway|global').setLabel('🎁 Sorteio Global (Público)').setStyle(ButtonStyle.Success),
                    new ButtonBuilder().setCustomId('btn_create_giveaway|vip').setLabel('💎 Sorteio Exclusivo VIP').setStyle(ButtonStyle.Secondary)
                );
                await painelSorteiosChannel.send({ embeds: [sorteioStaffEmbed], components: [sorteioRow] });
            }

            // --- 7. SAVE MASTER CONFIG DB ---
            await db.insert(serverConfigs).values({
                guildId: interaction.guild.id,
                adminRoleId: adminRoleId,
                supportRoleId: supportRoleId,
                auditChannelId: builtChannels['📜-audit-logs'],
                backupsChannelId: builtChannels['💾-backups-db'],
                ticketPanelChannelId: builtChannels['📩-suporte'],
                welcomeChannelId: builtChannels['👋-bem-vindo'],
                leaveChannelId: builtChannels['📜-audit-logs'], // Saídas logadas na auditoria para a staff
                setupComplete: new Date(),
            }).onConflictDoUpdate({
                target: serverConfigs.guildId,
                set: {
                    adminRoleId,
                    supportRoleId,
                    auditChannelId: builtChannels['📜-audit-logs'],
                    backupsChannelId: builtChannels['💾-backups-db'],
                    ticketPanelChannelId: builtChannels['📩-suporte'],
                    welcomeChannelId: builtChannels['👋-bem-vindo'],
                    leaveChannelId: builtChannels['📜-audit-logs'],
                    setupComplete: new Date(),
                }
            });

            AuditLogger.initialize(interaction.client, builtChannels['📜-audit-logs'], builtChannels['💾-backups-db']);
            AuditLogger.systemEvent('GOD-MODE SETUP V5 Executado', `A Blindagem Extrema e Isolamento de Setores foi ativada. ${Object.keys(builtChannels).length} canais sincronizados nas Matrizes. Canais Infiltrados foram purgados.`, interaction.user);

            const embed = UI.success(
                'Arquitetura V5.0 Suprema Implantada 🚀',
                'O servidor agora possui Sistema Anti-Raid via Portaria Isolada e Blindagem total de Setores.\n\n✅ Cargos de Staff criados e atribuídos na matriz de permissões.\n✅ Categorias Sociais de Staff criadas isoladamente (\`🗄️ STAFF SENS-PUBG\`).\n✅ Central de Controle e Sorteios restrita ao **Sens-Admin**.\n✅ Canais base para clonagem de Voz Premium (VIPs, Squads) gerados com sucesso.'
            );

            try {
                await interaction.editReply({ embeds: [embed] });
            } catch (networkError) {
                AuditLogger.error('Setup Reply Token efêmero expirou na rede.', String(networkError));
                try {
                    await interaction.followUp({ embeds: [embed], flags: MessageFlags.Ephemeral });
                } catch (e) { }
            }

        } catch (error: any) {
            AuditLogger.error('Failed to execute God-Mode Server Setup', error?.stack);
            try {
                const errEmbed = UI.error('Falha Crítica do Arquiteto', 'Certifique-se que o Bot tenha o maior Cargo do Servidor antes de escanear (Se outro cargo for superior, ele sofre erro de permissão do Discord ao tentar excluir/modificar cargos).');
                await interaction.editReply({ embeds: [errEmbed] });
            } catch (e) { }
        }
    },
};

export default setupCommand;
