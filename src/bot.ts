export { client }
import { ActivityType, Client as OldClient, ClientOptions } from 'discord.js'
import { Command, ClientEvent } from './utils/classes'
import { CLIENT_TOKEN, CLIENT_PREFIX, CLIENT_OWNER } from './config'
import * as path from 'path'
import * as fs from 'fs' 
import './utils/proto'

class Client extends OldClient {
    readonly owner: string
    readonly prefix: string
    readonly commands: Command[]
    readonly events: ClientEvent[]

    constructor(options?: ClientOptions) {
        super(options)

        this.owner = CLIENT_OWNER
        this.prefix = CLIENT_PREFIX
        this.commands = []
        this.events = []
    }

    private _load_commands(): void {
        const command_files = fs.readdirSync(path.join(__dirname, 'commands'))
            .map(file => path.join(__dirname, 'commands', file))

        for (const file of command_files) {
            if (file.endsWith('system.ts')) continue
            const command_array = require(file).default

            for (const client_command of command_array) this.commands.push(new client_command())
        }
    }

    private _load_events(): void {
        const event_files = fs.readdirSync(path.join(__dirname, 'events'))
            .map(file => path.join(__dirname, 'events', file))

        for (const file of event_files) {
            const event_file = require(file)
            if (!event_file.hasOwnProperty('default')) continue

            client.events.push(new event_file.default())
        }
    }

    public init() {
        this._load_commands()
        this._load_events()
        this.login(CLIENT_TOKEN)
    }
}
const client = new Client({
    intents: [
        'Guilds',
        'GuildMembers',
        'GuildEmojisAndStickers',
        'GuildPresences',
        'GuildMessages',
        'GuildMessageReactions',
        'DirectMessages',
        'DirectMessageReactions',
        'MessageContent',
    ]
})
client.init()

client.on('ready', () => {
    client.user.setActivity(`${client.prefix}help`, {type: ActivityType.Watching})
    console.log(true)
})

process.on('unhandledRejection', console.error)