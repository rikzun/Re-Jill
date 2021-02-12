export { ClientCommand, CommandOptions, MessageEmbed, Argument, Client_Args, Client_Pars }
import { PermissionString, MessageEmbed as OldMessageEmbed, Message } from 'discord.js'

type Constructors =
| 'Message'
| 'Number'
| 'GuildMembers'
| 'Guilds'

type Features =
| 'join'
| 'array'

interface Argument {
    name: string
    description: string
    required: boolean
    type?: Constructors
    features?: Features
}

interface Parameter {
    names: string[]
    description: string
    args: Argument[]
}

interface Client_Args {
    [arg_name: string]: unknown
}

interface Client_Pars {
    [par_name: string]: Client_Args
}

interface CommandOptions {
    names: string[]
    description: string
    
    client_perms: PermissionString[]
    member_perms: PermissionString[]

    owner_only: boolean
    guild_only: boolean

    args: Argument[]
    pars: Parameter[]
}

abstract class ClientCommand {
    readonly names: string[]
    readonly description: string

    readonly client_perms: PermissionString[]
    readonly member_perms: PermissionString[]

    readonly owner_only: boolean
    readonly guild_only: boolean

    readonly args: Argument[]
    readonly pars: Parameter[]
    
    constructor(options: CommandOptions) {
        this.names = options.names
        this.description = options.description

        this.client_perms = options.client_perms
        this.member_perms = options.member_perms

        this.owner_only = options.owner_only
        this.guild_only = options.guild_only

        this.args = options.args
        this.pars = options.pars
    }

    abstract execute(args: Client_Args, pars: Client_Pars): Promise<unknown>
    async send_help(message: Message): Promise<void> {
        const args = []
        const pars = []

        for (const arg of this.args) {
            if (arg.type == 'Message') continue

            let first_line = arg.name
            if (arg.features == 'array') first_line = '...' + first_line
            if (arg.features == 'join') first_line += '*'
            if (!arg.required) first_line += '?'

            args.push(`  ${first_line}\n    ${arg.description}\n`)
        }
        for (const par of this.pars) {
            let first_line = par.names.join(', ')

            if (!par.args.empty) first_line += ' ' + par.args.map(vv => {
                let first_line_arg = vv.name
                if (vv.features == 'array') first_line_arg = '...' + first_line_arg
                if (vv.features == 'join') first_line_arg += '*'
                if (!vv.required) first_line_arg += '?'

                return `<${first_line_arg}>`
            }).join(', ')

            pars.push(`  ${first_line}\n    ${par.description}\n`)
        }

        const desc = []
            .add('```autohotkey')
            .add('Описание:')
            .add(`  ${this.description}\n`)
            .add('Аргументы:')
            .add(args.join('\n'), !args.empty, '  отсутствуют\n')
            .add('Параметры:')
            .add(pars.join('\n'), !pars.empty, '  отсутствуют\n')
            .add('```')

        const Embed = new MessageEmbed()
            .setDescription(desc.join('\n'))
        await message.channel.send(Embed)
    }
}

class MessageEmbed extends OldMessageEmbed {
    constructor() {
        super()
        this.color = 3092790
    }
}