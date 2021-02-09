export { ClientCommand, CommandOptions, MessageEmbed, Parameter }
import { PermissionString, MessageEmbed as OldMessageEmbed, ClientOptions as OldClientOptions, GuildMember, Message } from 'discord.js'

type Constructors =
| 'number'
| 'GuildMember[]'

type Features =
| 'array'
| 'join'

interface Arguments {
    name: string
    description: string
    required: boolean
    type?: Constructors
    features?: Features
}

interface Parameter {
    aliases: string[]
    description: string
    execute: Function
}

class CommandOptions {
    aliases: string[]
    description?: string
    
    clientPerms?: PermissionString[]
    memberPerms?: PermissionString[]

    ownerOnly?: boolean
    guildOnly?: boolean

    args?: Arguments[]
    parameters?: Parameter[]

    constructor(options: CommandOptions) {
        this.aliases = options.aliases
        this.description = options.description ?? ''

        this.clientPerms = options.clientPerms ?? []
        this.memberPerms = options.memberPerms ?? []

        this.ownerOnly = options.ownerOnly ?? false
        this.guildOnly = options.guildOnly ?? false

        this.args = options.args ?? []
        this.parameters = options.parameters ?? []
    }
}

abstract class ClientCommand {
    readonly aliases: string[]
    readonly description: string
    readonly args: Arguments[]
    readonly parameters: Parameter[]

    readonly clientPerms: PermissionString[]
    readonly memberPerms: PermissionString[]

    readonly ownerOnly: boolean
    readonly guildOnly: boolean
    
    constructor(options: CommandOptions) {
        this.aliases = options.aliases
        this.description = options.description
        this.args = options.args
        this.parameters = options.parameters

        this.clientPerms = options.clientPerms
        this.memberPerms = options.memberPerms

        this.ownerOnly = options.ownerOnly
        this.guildOnly = options.guildOnly

        for (let i = 0; i < this.args.length; i++) {
            if (this.args[i].features == 'array') this.args[i].name = '...' + this.args[i].name
            if (this.args[i].features == 'join') this.args[i].name = this.args[i].name + '*'
            if (!this.args[i].required) this.args[i].name = this.args[i].name + '?'
        }
    }

    abstract execute(...args: unknown[]): Promise<unknown>
    async sendHelp(message: Message): Promise<void> {
        const args = this.args.map(v => `\t${v.name}\n\t\t${v.description}\n`)
        const parameters = this.parameters.map(v => `\t${v.aliases.join(', ')}\n\t\t${v.description}`)

        const desc = []
            .add('Описание:')
            .add(`\t${this.description}\n`, this.description, '\tотсутствует\n')
            .add('Аргументы:')
            .add(args.join('\n'), !args.empty, '\tотсутствуют\n')
            .add('Параметры:')
            .add(parameters.join('\n'), !parameters.empty, '\tотсутствуют\n')

        const Embed = new MessageEmbed()
            .setDescription('```autohotkey\n' + desc.join('\n') + '```')
        await message.channel.send(Embed)
    }
}

class MessageEmbed extends OldMessageEmbed {
    constructor() {
        super()
        this.color = 3092790
    }
}