import { Events, VoiceState, ChannelType, PermissionFlagsBits } from 'discord.js';

export default {
    name: Events.VoiceStateUpdate,
    async execute(oldState: VoiceState, newState: VoiceState) {
        // --- 1. HANDLE JOINING A HUB (CREATING ROOM) ---
        if (newState.channel && newState.channelId !== oldState.channelId) {
            const joinedChannel = newState.channel;
            const member = newState.member;

            if (!member || !joinedChannel.parentId) return;

            let newChannelName = '';
            let userLimit = 0;
            let isVip = false;

            if (joinedChannel.name.includes('➕-criar-squad')) {
                newChannelName = `⛺ Squad do ${member.user.username}`;
            } else if (joinedChannel.name.includes('➕-criar-duo')) {
                newChannelName = `⛺ Duo do ${member.user.username}`;
                userLimit = 2;
            } else if (joinedChannel.name.includes('➕-criar-sala-vip')) {
                newChannelName = `👑 VIP Lounge ${member.user.username}`;
                isVip = true;
            }

            if (newChannelName !== '') {
                try {
                    // Copia as permissões do Hub principal
                    const hubOverwrites = joinedChannel.permissionOverwrites.cache.map(v => ({ id: v.id, allow: v.allow.toArray(), deny: v.deny.toArray() }));

                    // Adiciona as permissões de "DONO" (Pode Kickar/Mutar/Mover no próprio canal)
                    hubOverwrites.push({
                        id: member.id,
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.Connect,
                            PermissionFlagsBits.Speak,
                            PermissionFlagsBits.MuteMembers,
                            PermissionFlagsBits.DeafenMembers,
                            PermissionFlagsBits.MoveMembers,
                            PermissionFlagsBits.ManageChannels // Pode mudar o nome da sala dele se quiser
                        ] as any,
                        deny: []
                    });

                    const createParams: any = {
                        name: newChannelName,
                        type: ChannelType.GuildVoice,
                        parent: joinedChannel.parentId,
                        permissionOverwrites: hubOverwrites,
                        reason: 'Dynamic Voice Hub Generation (Sens-Bot VIP/Squad)'
                    };

                    if (userLimit > 0) createParams.userLimit = userLimit;

                    if (isVip && newState.guild.premiumTier >= 3) { // Max bitrate for VIP if server is tier 3
                        createParams.bitrate = 384000;
                    } else if (isVip && newState.guild.premiumTier === 2) {
                        createParams.bitrate = 256000;
                    }

                    const generatedChannel = await newState.guild.channels.create(createParams);

                    // Move o usuário magicamente para o novo canal criado
                    await member.voice.setChannel(generatedChannel as any);

                } catch (error) {
                    console.error('Falha ao gerar canal dinâmico', error);
                }
            }
        }

        // --- 2. HANDLE LEAVING A ROOM (DELETING ROOM) ---
        if (oldState.channel && oldState.channelId !== newState.channelId) {
            const leftChannel = oldState.channel;

            // Se for uma sala dinâmica recém-criada e ficar vazia, nós excluímos!
            if ((leftChannel.name.startsWith('⛺') || leftChannel.name.startsWith('👑')) && leftChannel.members.size === 0) {
                try {
                    await leftChannel.delete('Dynamic Voice Hub ficou vazio.');
                } catch (error) {
                    console.error('Falha ao excluir canal dinâmico vazio', error);
                }
            }
        }
    },
};
