import { Events } from 'discord.js';
import type { ClientEvent } from '../types/index.js';
import { AuditLogger } from '../utils/logger.js';

const guildMemberAddEvent: ClientEvent<Events.GuildMemberAdd> = {
    name: Events.GuildMemberAdd,
    async execute(member) {
        console.log(`[DEBUG] Member Joined: ${member.user.tag} in ${member.guild.name}`);
        // Delay para garantir sincronização de cache do Discord
        setTimeout(async () => {
            await AuditLogger.memberJoined(member);
        }, 2000);
    },
};

export default guildMemberAddEvent;
