import {client} from '../bot'
import { TextChannel } from 'discord.js';
client.on('guildMemberAdd', async(member) => {
    if (member.guild.id !== '606996193733640202') return;
    const memberAddMessage = `В наш бар зашёл новый пользователь, ${member}!\n` +
    `Он - ${member.guild.memberCount} посетитель!\n\n`

    const channel = await client.channels.fetch('607266333410852874') as TextChannel
    channel.send(memberAddMessage)
})