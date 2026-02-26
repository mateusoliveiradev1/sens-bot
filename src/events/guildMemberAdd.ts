import { Events } from 'discord.js';
import type { ClientEvent } from '../types/index.js';
import { AuditLogger } from '../utils/logger.js';

const guildMemberAddEvent: ClientEvent<Events.GuildMemberAdd> = {
    name: Events.GuildMemberAdd,
    async execute(member) {
        await AuditLogger.memberJoined(member);
    },
};

export default guildMemberAddEvent;
