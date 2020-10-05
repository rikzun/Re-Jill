import { print } from './utils'
import { Client as BasicClient } from 'discord.js'
import * as path from 'path'
import * as fs from 'fs' 

//Better bot class
class Client extends BasicClient {
    public owner: string
    public prefix: string
    public version: string
    public commands: {
        [command: string]: {
            run: Function
            args: { [arg: string]: Constructors }
            status: boolean
            ownerOnly: boolean
            guildOnly: boolean
        }
    }
}

type Constructors =
| ''
| 'string'
| 'number'
| 'GuildMember'

export class fileCommands {
    aliases: string[]
    args?: { [arg: string]: Constructors }
    ownerOnly?: boolean
    guildOnly?: boolean
    run: Function
}

export const client: Client = new Client()
client.owner = '532935768918982656'
client.version = '0.2.1d3'
client.prefix = './'
client.commands = {}

//event handler
const eventFiles = fs.readdirSync(__dirname + '/events').map(f => path.join(__dirname, 'events', f))
for (const file of eventFiles) {
    require(file)
}

//command handler
const commandFiles = fs.readdirSync(__dirname + '/commands').map(f => path.join(__dirname, 'commands', f))
for (const file of commandFiles) {
    const commandsArray = require(file).default
    for (const command of commandsArray) {
        const cmd =
        {
            run: command.run,
            args: command.args ?? {},
            ownerOnly: command.ownerOnly ?? false,
            guildOnly: command.guildOnly ?? false,
            status: true
        }
        command.aliases.forEach(alias => client.commands[alias] = cmd)
    }
}

client.once('ready', () => {
    print('Jill готова к работе!')
})

client.login(require('../token.json').DISCORD_TOKEN)