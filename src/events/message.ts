import {Message} from 'discord.js'
import {print} from '../py'
import {
    client, prefix
} from '../bot'

let rollReg = /(\d*)?d(\d+)([-+*/])?(\d+)?( _\d+)?( .+)?/i

client.on('message', async (message: Message) => {
    if (!message.guild) return;
    if (!message.content.startsWith(prefix)) return;

    let args = message.content.substring(prefix.length).split(' ')
    if (message.content.substring(prefix.length).match(rollReg)) {
        args = message.content.match(rollReg)
        args[0] = 'roll'
    }

    if (client.commands.has(args[0].toLowerCase())) {
        client.commands.get(args[0].toLowerCase()).run(message, args)
    }
})