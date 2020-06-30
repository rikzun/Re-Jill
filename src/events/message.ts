import {Message} from 'discord.js'
import {print} from '../py'
import {client} from '../bot'

let rollReg = /(\d*)?d(\d+)([-+*/])?(\d+)?( _\d+)?( .+)?/i

client.on('message', async (message: Message) => {
    if (!message.guild) return;
    if (!message.content.startsWith(client.prefix)) return;
    let args = message.content.substring(client.prefix.length).split(' ')
    
    //roll
    if (message.content.substring(client.prefix.length).match(rollReg)) {
        args = message.content.match(rollReg)
        args[0] = 'roll'
    }

    //cmd
    if (client.commands.hasOwnProperty(args[0]) && client.commands[args[0]].on) {
        client.commands[args[0]].file.run(message, args)
    }
})