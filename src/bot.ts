export { client }
import { Client as OldClient, ClientOptions } from 'discord.js'
import { ClientCommand } from './utils/classes'
import * as path from 'path'
import * as fs from 'fs' 
import './utils/proto'

class Client extends OldClient {
    readonly owner: string
    readonly prefix: string
    readonly commands: ClientCommand[]

    constructor(options?: ClientOptions) {
        super(options)

        this.owner = '532935768918982656'
        this.prefix = './'
        this.commands = []
    }

    public loadCommands(): void {
        const commandFiles = fs.readdirSync(path.join(__dirname, 'commands'))
            .map(file => path.join(__dirname, 'commands', file))

        for (const file of commandFiles) {
            if (file.endsWith('system.ts')) continue
            const commandArray = require(file).default

            for (const clientCommand of commandArray) this.commands.push(new clientCommand())
        }
    }

    public loadEvents(): void {
        const eventFiles = fs.readdirSync(path.join(__dirname, 'events'))
            .map(file => path.join(__dirname, 'events', file))

        for (const file of eventFiles) require(file)
    }
}

const client = new Client()
client.loadCommands()
client.loadEvents()
client.login(process.env.DISCORD_TOKEN ?? require('../config.json').DISCORD_TOKEN)

client.on('ready', () => {
    console.log('Jill готова к работе')
})