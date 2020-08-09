import {client, CommandFile} from '../bot'
import {Message, GuildMember} from 'discord.js'
import {print, get} from '../py'

const commands: CommandFile[] = [
    {
        names: ['clear'],
        perms: ['MANAGE_MESSAGES'],
        guild: true,
        args: {amount: 'number', 'member?': 'GuildMember'},
        run: async (message: Message, amount: number, member?: GuildMember) => {
            if (!member) {
                message.channel.messages.fetch({ limit: 100 })
            }
        }
    }
]
export default commands