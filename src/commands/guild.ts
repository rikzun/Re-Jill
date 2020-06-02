import {client} from '../bot'
import {Guild, Message} from 'discord.js'
import {print} from '../py'

module.exports = {
    name: 'guild',
    execute(message: Message, args: string[]) {
        print(client.events)
        print(client.unloadedEvents)
        // console.log(typeof(module.exports.execute))
        // const msg = client.guilds.cache.get(args[1]).channels.cache
        // console.log(Array.from(msg))
    }
}