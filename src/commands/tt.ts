import { fileCommands } from '../bot'
import { Message } from 'discord.js'
import { wait, print } from '../utils'

const commands: fileCommands[] = [
    {
        aliases: ['tt'],
        ownerOnly: true,
        run: async (message: Message) => {
            
        }
    }
]
export default commands