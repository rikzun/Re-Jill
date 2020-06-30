import {client} from '../bot'
import {Message, MessageEmbed} from 'discord.js'
import {data} from '../events/firebase'

module.exports = {
    'help': async (message: Message, args: string[]) => {
        const msg = new MessageEmbed()
            .addField('Сайт с командами', '[ссыл очка](https://rikzun.github.io/jill.html)')
        message.channel.send(msg)
    }
}