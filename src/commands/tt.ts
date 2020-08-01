import {client, CommandFile} from '../bot'
import {Message, GuildMember, User} from 'discord.js'
import {print, get} from '../py'

const commands: CommandFile[] = [
    {
        names: ['tt'],
        owner: true,
        run: async (message: Message, ) => {
        }
    }
]
export default commands