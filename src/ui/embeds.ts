import { EmbedBuilder } from 'discord.js';

const SENS_PUBG_COLORS = {
    primary: 0x9333ea, // Neon Purple matching modern gaming interfaces
    success: 0x22c55e, // Bright Green
    error: 0xef4444,   // Alert Red
    warning: 0xf59e0b, // Notice Yellow
    info: 0x3b82f6,    // Ocean Blue
    ticketOpen: 0x10b981, // Emerald
    ticketClose: 0xf43f5e, // Rose
    systemBuild: 0x8b5cf6, // Violet
};

export const UI = {
    success(title: string, description: string): EmbedBuilder {
        return new EmbedBuilder()
            .setTitle(`✅ ${title}`)
            .setDescription(description)
            .setColor(SENS_PUBG_COLORS.success);
    },

    error(title: string, description: string): EmbedBuilder {
        return new EmbedBuilder()
            .setTitle(`❌ ${title}`)
            .setDescription(description)
            .setColor(SENS_PUBG_COLORS.error);
    },

    premium(title: string, args: { description?: string; fields?: { name: string, value: string, inline?: boolean }[], image?: string }): EmbedBuilder {
        const embed = new EmbedBuilder()
            .setTitle(`🌟 ${title}`)
            .setColor(SENS_PUBG_COLORS.primary)
            .setFooter({ text: 'Sens-PUBG Official Manager', iconURL: 'https://media.discordapp.net/attachments/1187422501099688047/1269006093738573906/sens_logo.png' })
            .setTimestamp();

        if (args.description) embed.setDescription(args.description);
        if (args.fields) embed.addFields(args.fields);
        if (args.image) embed.setImage(args.image);

        return embed;
    },

    // Painel Especializado para Auditoria
    dashboardPanel(title: string, args: { description: string, color: 'info' | 'warning' | 'error' | 'success' | 'primary' | 'ticketOpen' | 'ticketClose' | 'systemBuild', author?: { name: string, iconURL: string }, thumbnail?: string, fields?: { name: string, value: string, inline?: boolean }[] }): EmbedBuilder {
        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(args.description)
            .setColor(SENS_PUBG_COLORS[args.color])
            .setTimestamp()
            .setFooter({ text: 'Central de Auditoria • Sens-PUBG' });

        if (args.author) embed.setAuthor(args.author);
        if (args.thumbnail) embed.setThumbnail(args.thumbnail);
        if (args.fields) embed.addFields(args.fields);

        return embed;
    },

    // Painel Ultrawide Especializado para Comunicados e Sorteios
    announcementOfficial(title: string, args: { description: string, color: 'info' | 'warning' | 'error' | 'success' | 'primary' | 'systemBuild', author: { name: string, iconURL: string }, image?: string }): EmbedBuilder {
        const embed = new EmbedBuilder()
            .setAuthor({ name: `${args.author.name} • Publicação Autorizada`, iconURL: args.author.iconURL })
            .setDescription(`# ${title}\n\n${args.description}`)
            .setColor(SENS_PUBG_COLORS[args.color])
            .setTimestamp()
            .setFooter({ text: 'Sens-Bot APP Official • Gerenciador de Inteligência', iconURL: 'https://cdn-icons-png.flaticon.com/512/6122/6122002.png' }); // Shield Icon

        if (args.image) {
            embed.setImage(args.image);
        }

        return embed;
    },

    vipMessageOfficial(title: string, args: { description: string, author: { name: string, iconURL: string }, image?: string }): EmbedBuilder {
        const embed = new EmbedBuilder()
            .setAuthor({ name: `${args.author.name} • Comunicação Exclusiva VIP 💎`, iconURL: args.author.iconURL })
            .setDescription(`## 👑 ${title}\n>>> ${args.description}`)
            .setColor(SENS_PUBG_COLORS.warning) // Dourado VIP
            .setTimestamp()
            .setFooter({ text: 'Império VIP • Sens-PUBG', iconURL: 'https://cdn-icons-png.flaticon.com/512/7608/7608226.png' }); // Coroa Icon

        if (args.image) {
            embed.setImage(args.image);
        }

        return embed;
    },

    audit(action: string, details: string): EmbedBuilder {
        return new EmbedBuilder()
            .setTitle(`🛡️ Audit Event: ${action}`)
            .setDescription(`\`\`\`\n${details}\n\`\`\``)
            .setColor(SENS_PUBG_COLORS.warning)
            .setTimestamp();
    }
};
