import {Message} from 'discord.js'
import {print} from '../py'
import {
    client, prefix
} from '../bot'

client.on('message', (message: Message) => {
    let args = message.content.substring(prefix.length).split(' ')
    try {
        switch (args[0]) {

            case 'guild':
                client.commands.get('guild').execute(message, args)
                break;

            case 'module':
                client.commands.get('module').execute(message, args)
                break;

            case 'modules':
                client.commands.get('modules').execute(message)
                break;
        }
    } catch (error) {}
})