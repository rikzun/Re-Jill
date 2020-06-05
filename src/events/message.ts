import {Message} from 'discord.js'
import {print} from '../py'
import {
    client, prefix
} from '../bot'

client.on('message', async (message: Message) => {
    let args = message.content.substring(prefix.length).split(' ')
    const cmd = client.commands
    if (cmd.has(args[0].toLowerCase())) {
        cmd.get(args[0].toLowerCase()).run(message, args)
    }
})