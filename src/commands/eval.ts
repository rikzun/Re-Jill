import {client} from '../bot'
import {inspect} from "util";
import {Message, MessageEmbed} from 'discord.js'

module.exports = {
    'eval': async (message: Message, args: string[]) => {
        if (message.author.id !== client.owner) return;
        try {
            args.shift();
            const code = args.join(" ");
            let evaled = await eval(code);

            if (typeof evaled !== "string") evaled = inspect(evaled);
            
            message.channel.send('>>> ```ts\n' + evaled.slice(0, 1900) + '```')
        } catch (error) {
            message.channel.send('>>> ```ts\n' + error + '```')

        }
    }
}