export { client }
import { Client as OldClient, ClientOptions } from 'discord.js'
import { ClientCommand } from './utils/classes'
import { CLIENT_TOKEN, CLIENT_PREFIX, CLIENT_OWNER } from './config'
import * as path from 'path'
import * as fs from 'fs' 
import './utils/proto'

class Client extends OldClient {
    readonly owner: string
    readonly prefix: string
    readonly commands: ClientCommand[]

    constructor(options?: ClientOptions) {
        super(options)

        this.owner = CLIENT_OWNER
        this.prefix = CLIENT_PREFIX
        this.commands = []
    }

    public load_commands(): void {
        const command_files = fs.readdirSync(path.join(__dirname, 'commands'))
            .map(file => path.join(__dirname, 'commands', file))

        for (const file of command_files) {
            if (file.endsWith('system.ts')) continue
            const command_array = require(file).default

            for (const client_command of command_array) this.commands.push(new client_command())
        }
    }

    public load_events(): void {
        const event_files = fs.readdirSync(path.join(__dirname, 'events'))
            .map(file => path.join(__dirname, 'events', file))

        for (const file of event_files) {
            require(file)
        }
    }
}

const client = new Client()
client.load_commands()
client.load_events()
client.login(CLIENT_TOKEN)

client.on('ready', () => console.log(true))