export { ClientCommand, CommandOptions, MessageEmbed }
import { PermissionString, MessageEmbed as OldMessageEmbed, ClientOptions as OldClientOptions, GuildMember, Message } from 'discord.js'

type Constructors =
| 'string'
| 'number'
| 'GuildMember[]'

type Features =
| 'array'
| 'join'

interface Arguments {
    name: string
    description: string
    type: Constructors
    features?: Features
}

interface Parameters {
    aliases: string[]
    description: string
    child?: string
    execute: Function
}

interface CommandOptions {
    aliases: string[]
    description?: string
    args?: Arguments[]
    parameters?: Parameters[]

    clientPerms?: PermissionString[]
    memberPerms?: PermissionString[]

    ownerOnly?: boolean
    guildOnly?: boolean
}

abstract class ClientCommand {
    readonly aliases: string[]
    readonly description: string
    readonly args: Arguments[]
    readonly parameters: Parameters[]

    readonly clientPerms: PermissionString[]
    readonly memberPerms: PermissionString[]

    readonly ownerOnly: boolean
    readonly guildOnly: boolean
    
    constructor(options: CommandOptions) {
        this.aliases = options.aliases
        this.description = options.description ?? 'Описание отсутствует'
        this.args = options.args ?? []
        this.parameters = options.parameters ?? []

        this.clientPerms = options.clientPerms ?? []
        this.memberPerms = options.memberPerms ?? []

        this.ownerOnly = options.ownerOnly ?? false
        this.guildOnly = options.guildOnly ?? false
    }

    abstract clear(): void
    abstract execute(...args: unknown[]): Promise<unknown>
    async sendHelp(message: Message): Promise<void> {
        const args = this.args.map(v => `\t${v.name}\n\t\t${v.description}\n`)
        const parameters = this.parameters.map(v => `\t${v.aliases.join(', ')}\n\t\t${v.description}`)

        const desc = []
            .add(`${this.description}\n`)
            .add('Аргументы:')
            .add(args.join('\n'), !args.empty)
            .add('\tотсутствуют', args.empty)
            .add('Параметры:')
            .add(parameters.join('\n'), !parameters.empty)
            .add('\tотсутствуют', parameters.empty)

        const Embed = new MessageEmbed()
            .setDescription('```\n' + desc.join('\n') + '```')
        await message.channel.send(Embed)
    }
}

class MessageEmbed extends OldMessageEmbed {
    constructor() {
        super()
        this.color = 3092790
    }
}