export { client }
import { Client as OldClient } from 'discord.js'
import { ClientCommand, RawCommand, ClientOptions } from './utils/classes'
import { DISCORD_TOKEN } from './config'
import * as path from 'path'
import * as fs from 'fs' 
import './utils/proto'

class Client extends OldClient {
    public owner: string
    public prefix: string
    public commands: {
        [command: string]: ClientCommand
    }

    constructor(options?: ClientOptions) {
        super(options)

        this.owner = '532935768918982656'
        this.prefix = '//'
        this.commands = {}
    }

    public loadCommands(): void {
        const commandFiles = fs.readdirSync(path.join(__dirname, 'commands'))
            .map(file => path.join(__dirname, 'commands', file))

        for (const file of commandFiles) {
            const rawCmdArray: RawCommand[] = require(file).default

            for (const rawCmd of rawCmdArray) {
                const command = new ClientCommand(rawCmd)
                rawCmd.aliases.forEach(alias => this.commands[alias] = command)
            }
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
client.login(DISCORD_TOKEN)

client.on('ready', () => {
    console.log('Jill готова к работе')
})