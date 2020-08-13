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
        }
    }
]
export default commands