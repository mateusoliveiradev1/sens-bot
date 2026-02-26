import { Events } from 'discord.js';
import type { ClientEvent } from '../types/index.js';
import { AuditLogger } from '../utils/logger.js';

const guildMemberRemoveEvent: ClientEvent<Events.GuildMemberRemove> = {
    name: Events.GuildMemberRemove,
    async execute(member) {
        console.log(`[DEBUG] Member Left: ${member.user?.tag || member.id} from ${member.guild.name}`);
        await AuditLogger.memberLeft(member);
    },
};

export default guildMemberRemoveEvent;
