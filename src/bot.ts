import {config} from 'dotenv'
import {data} from './events/firebase'
import {print} from './py'
import * as fs from 'fs' 
import {
    Client as BasicClient, TextChannel
} from 'discord.js'

//Better bot class
class Client extends BasicClient {
    public commands: {
        [command: string]: {
            file: {
                name: string,
                run: Function
            },
            on: boolean
        }
    }
    public multi: {
        queue: TextChannel,
        ban: TextChannel
    }
    public events: string[]
    public owner: string
    public prefix: string
}

config();
const token = process.env.DISCORD_TOKEN
export const client: Client = new Client();
client.commands = {};
client.events = [];
client.owner = '532935768918982656'
client.prefix = process.env.PREFIX


//Event handler
const eventFiles = fs.readdirSync(__dirname + '/events').filter(file => file.endsWith('.ts'));
for (const file of eventFiles) {
    require(`./events/${file}`)

    client.events.push('.' + file.replace('.ts', ''))
}

//Command handler
const commandFiles = fs.readdirSync(__dirname + '/commands').filter(file => file.endsWith('.ts'));
for (const file of commandFiles) {
    const commandFile = require(`./commands/${file}`)

    //cmd
    for (const command in commandFile) {
        client.commands[command] = {
            file: {
                name: file,
                run: commandFile[command]
            },
            on: true
        }
    }
}

client.once('ready', () => {
    client.user.setActivity('./help', { type: 'WATCHING' })
    print('Jill готова к работе!')
})

client.login(token)