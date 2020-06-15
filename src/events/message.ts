import {Message} from 'discord.js'
import {print} from '../py'
import {
    client, prefix
} from '../bot'

client.on('message', async (message: Message) => {
    if (!message.guild) return;

    let args = message.content.substring(prefix.length).split(' ')
    if (client.commands.has(args[0].toLowerCase())) {
        client.commands.get(args[0].toLowerCase()).run(message, args)
    }
})