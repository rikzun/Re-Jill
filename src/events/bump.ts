import { print, arrayTypeChange, get } from '../py';
import {Message} from 'discord.js'
import {
    client
} from '../bot'

client.on('message', async (message: Message) => {
    if (get(message.guild, 'id') !== '606996193733640202') return;
    if (!['315926021457051650', '464272403766444044'].includes(message.author.id)) return;

    //sd.c
    if (get(message.embeds[0], 'description', '').includes('Нравится сервер?')) {
        setTimeout(() => {
            message.channel.send('Настало время для `s.up`')
        }, 3595000)
    }

    //server monitoring
    if (get(message.embeds[0], 'description', '').includes('Server bumped by')) {
        setTimeout(() => {
            message.channel.send('Настало время для `!bump`')
        }, 3595000)
    }
})