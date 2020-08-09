import {config} from 'dotenv'
import {data} from './events/firebase'
import {print, get, arrayDelValue} from './py'
import * as fs from 'fs' 
import {
    Client as BasicClient, PermissionString
} from 'discord.js'

type constructors =
| ''
| 'number'
| 'string'
| 'User'
| 'GuildMember'
| 'TextChannel'
| 'VoiceChannel'

export class CommandFile {
    names: string[]
    guild?: boolean
    owner?: boolean
    perms?: PermissionString[]
    regexp?: {
        exp: RegExp
        only?: boolean
        output?: string
    }
    args?: {
        [arg: string]: constructors
    }
    run: Function
}

class RegexpBasic {
    regexp: RegExp
    only: boolean
    output: string
}

//Better bot class
class Client extends BasicClient {
    public commands: {
        [command: string]: {
            on: boolean,
            index: number,
            names: string[],
            run: Function,
            file: string,
            propertes: {
                args: {
                    [arg: string]: string
                },
                only: boolean,
                perms: PermissionString[],
                guild: boolean,
                owner: boolean
            }
        }
    }
    public files: {
        [file: string]: string[]
    }
    public regexp: RegexpBasic[]
    public events: string[]
    public owner: string
    public version: string
    public prefix: string
}

config();
const token = process.env.DISCORD_TOKEN
export const client: Client = new Client()
client.files = {}
client.commands = {}
client.events = []
client.owner = '532935768918982656'
client.version = '0.2.1'
client.prefix = process.env.PREFIX
client.regexp = []

//Event handler
const eventFiles = fs.readdirSync(__dirname + '/events').filter(file => file.endsWith('.ts'))
for (const file of eventFiles) {
    require(`./events/${file}`)

    client.events.push('.' + file.replace('.ts', ''))
}

//Command handler
const commandFiles = fs.readdirSync(__dirname + '/commands').filter(file => file.endsWith('.ts'))
for (const file of commandFiles) {
    const commandFile = require(`./commands/${file}`).default

    //cmd
    client.files[file] = []
    commandFile.forEach((cmd, i, a) => {
        client.files[file].push(cmd.names[0])

        cmd.names.forEach(name => {
            client.commands[name] = {
                on: true,
                index: i,
                names: cmd.names,
                run: cmd.run,
                file: file,
                propertes: {
                    only: get(cmd.regexp, 'only', false),
                    args: cmd.args ?? {},
                    perms: cmd.perms ?? [],
                    guild: cmd.guild ?? false,
                    owner: cmd.owner ?? false,
                }
            }
        })

        if (cmd.hasOwnProperty('regexp')) {
            client.regexp.push(
                {
                    regexp: cmd.regexp.exp,
                    only: cmd.regexp.only ?? false,
                    output: cmd.regexp.output ?? false
                }
            )
        }
    });
}

client.once('ready', () => {
    client.user.setActivity('./help', { type: 'WATCHING' })
    print('Jill готова к работе!')
})

client.login(token)