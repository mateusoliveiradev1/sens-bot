import { Events, MessageFlags, type Interaction } from 'discord.js';
import type { ClientEvent } from '../types/index.js';
import { commandsCache } from '../handlers/commands.js';
import { componentsCache } from '../handlers/components.js';
import { UI } from '../ui/embeds.js';
import { AuditLogger } from '../utils/logger.js';

const interactionCreateEvent: ClientEvent<Events.InteractionCreate> = {
    name: Events.InteractionCreate,
    async execute(interaction: Interaction) {
        // 1. Application Commands Parser (Slash & Context Menus)
        if (interaction.isChatInputCommand() || interaction.isContextMenuCommand()) {
            const command = commandsCache.get(interaction.commandName);
            if (!command) return;

            try {
                await command.execute(interaction);
            } catch (error: any) {
                const isUnknownInteraction = error?.code === 10062 || error?.message?.includes('Unknown interaction');
                if (isUnknownInteraction) {
                    console.warn(`[WARN] Timeout de Rede (10062) ignorado no comando: ${interaction.commandName}`);
                } else {
                    AuditLogger.error(`Execution fault in command: ${interaction.commandName}`, error?.stack);
                    try {
                        const erroEmbed = UI.error('Falha no Comando', 'Erro letal ao executar.');
                        if (interaction.replied || interaction.deferred) {
                            await interaction.followUp({ embeds: [erroEmbed], flags: MessageFlags.Ephemeral });
                        } else {
                            await interaction.reply({ embeds: [erroEmbed], flags: MessageFlags.Ephemeral });
                        }
                    } catch (apiError: any) {
                        AuditLogger.error(`API Fallback falhou, token da interação provavelmente expirou (Timeout).`, apiError?.message);
                    }
                }
            }
            return;
        }

        // 2. Component/Modal Parser
        if (interaction.isButton() || interaction.isAnySelectMenu() || interaction.isModalSubmit()) {
            const component = componentsCache.get(interaction.customId);

            if (!component) {
                // Fallback for dynamically generated Custom IDs (e.g., ticket_close_123)
                // Checks if any cached component ID acts as a prefix to the exact customId mapping
                const dynamicComponent = componentsCache.find(c => interaction.customId.startsWith(c.id));

                if (dynamicComponent) {
                    try { await dynamicComponent.execute(interaction); } catch (e: any) { AuditLogger.error(`Dynamic Component Failure: ${interaction.customId}`, e?.stack); }
                } else {
                    AuditLogger.info(`Unmapped component interaction triggered: ${interaction.customId}`);
                }
                return;
            }

            try {
                await component.execute(interaction);
            } catch (error: any) {
                const isUnknownInteraction = error?.code === 10062 || error?.message?.includes('Unknown interaction');
                if (isUnknownInteraction) {
                    console.warn(`[WARN] Timeout de Rede (10062) ignorado no Componente ${interaction.customId}`);
                } else {
                    AuditLogger.error(`Component Execution fault in ${interaction.customId}`, error?.stack);
                    try {
                        const erroEmbed = UI.error('Ação Inválida', 'Este botão falhou inexperadamente.');
                        if (interaction.replied || interaction.deferred) await interaction.followUp({ embeds: [erroEmbed], flags: MessageFlags.Ephemeral });
                        else await interaction.reply({ embeds: [erroEmbed], flags: MessageFlags.Ephemeral });
                    } catch (apiError: any) {
                        AuditLogger.error(`Component API Fallback falhou (Timeout).`, apiError?.message);
                    }
                }
            }
        }
    },
};

export default interactionCreateEvent;
