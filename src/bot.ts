import {config} from 'dotenv'
import {data} from './events/firebase'
import {print, get, arrayDelValue} from './py'
import * as fs from 'fs' 
import {
    Client as BasicClient, PermissionString
} from 'discord.js'

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
                args: string[],
                perms: PermissionString[],
                guild: boolean,
                owner: boolean
            }
        }
    }
    public files: {
        [file: string]: string[]
    }
    public events: string[]
    public owner: string
    public prefix: string
}

config();
const token = process.env.DISCORD_TOKEN
export const client: Client = new Client()
client.files = {}
client.commands = {}
client.events = []
client.owner = '532935768918982656'
client.prefix = process.env.PREFIX


//Event handler
const eventFiles = fs.readdirSync(__dirname + '/events').filter(file => file.endsWith('.ts'))
for (const file of eventFiles) {
    require(`./events/${file}`)

    client.events.push('.' + file.replace('.ts', ''))
}

//Command handler
const commandFiles = fs.readdirSync(__dirname + '/commands').filter(file => file.endsWith('.ts'))
for (const file of commandFiles) {
    const commandFile = require(`./commands/${file}`)

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
                    args: cmd.args ?? [],
                    perms: cmd.perms ?? [],
                    guild: cmd.guild ?? false,
                    owner: cmd.owner ?? false,
                }
            }
        });
    });
}

client.once('ready', () => {
    client.user.setActivity('./help', { type: 'WATCHING' })
    print('Jill готова к работе!')
})

client.login(token)