export { 
    ClientCommand, CommandOptions, MessageEmbed, Command_Args, 
    Command_Pars, Constructors, Client_Argument, ClientEvent, 
}
import { PermissionString, MessageEmbed as OldMessageEmbed, Message } from 'discord.js'
import { tr } from './translate'

type Constructors =
| 'Message'
| 'Number'
| 'GuildMembers'
| 'Guilds'

type Features =
| 'join'
| 'array'

interface Command_Argument {
    name: string
    description?: string
    required: boolean
    type?: Constructors
    features?: Features
}

interface Command_Parameter {
    names: string[]
    description?: string
    args?: Command_Argument[]
}

interface Command_Args {
    [arg_name: string]: unknown
}

interface Command_Pars {
    [par_name: string]: Command_Args
}

interface Client_Argument {
    name: string
    description: string
    required: boolean
    type?: Constructors
    features?: Features
}

interface Client_Parameter {
    names: string[]
    description: string
    args: Client_Argument[]
}

interface CommandOptions {
    names: string[]
    description?: string
    additional?: string
    
    client_perms: PermissionString[]
    member_perms: PermissionString[]

    owner_only?: boolean
    guild_only?: boolean

    args?: Command_Argument[]
    pars?: Command_Parameter[]
}

abstract class ClientCommand {
    readonly names: string[]
    readonly description: string
    readonly additional: string

    readonly client_perms: PermissionString[]
    readonly member_perms: PermissionString[]

    readonly owner_only: boolean
    readonly guild_only: boolean

    readonly args: Client_Argument[]
    readonly pars: Client_Parameter[]
    
    constructor(options: CommandOptions) {
        this.names = options.names
        this.description = options.description ?? 'отсутствует'
        this.additional = options.additional

        this.client_perms = options.client_perms
        this.member_perms = options.member_perms

        this.owner_only = options.owner_only ?? false
        this.guild_only = options.guild_only ?? false
        
        this.args = options.args?.map(v => {
            if (!v.description) v.description = 'отсутствует'
            return v
        }) as Client_Argument[] ?? []

        this.pars = options.pars?.map(v => {
            if (!v.description) v.description = 'отсутствует'
            if (!v.args) v.args = []
            return v
        }) as Client_Parameter[] ?? []
    }

    abstract execute(args: Command_Args, pars: Command_Pars): Promise<unknown>
    send_help(message: Message): void {
        const args = []
        const pars = []

        for (const arg of this.args) {
            if (arg.type == 'Message') continue

            let first_line = arg.name
            if (arg.features == 'array') first_line = '...' + first_line
            if (arg.features == 'join') first_line += '*'
            if (!arg.required) first_line += '?'

            args.push(`  <${first_line}>\n\t${arg.description}\n`)
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

            pars.push(`  ${first_line}\n\t${par.description}\n`)
        }
        const desc = []
            .add('```autohotkey')
            .add((this.names.length > 1 ? 'Имена' : 'Имя') + ` команды: ${this.names.join(', ')}.`)
            .add(`Описание: ${this.description}`)
            .add(`Дополнительно: ${this.additional}\n`, this.additional)
            .add(`Аргументы:\n${args.join('\n')}`, !args.empty, 'Аргументы:\n  отсутствуют\n')
            .add(`Параметры:\n${pars.join('\n')}`, !pars.empty, 'Параметры:\n  отсутствуют\n')
            .add('Требуемые права:', !this.client_perms.empty || this.member_perms.empty)
            .add(`  Бота:\n${this.client_perms.map(v => `\t${tr(v)}`).join(',\n')}\n`, !this.client_perms.empty)
            .add(`  Пользователя:\n${this.member_perms.map(v => `\t${tr(v)}`).join(',\n')}\n`, !this.member_perms.empty)
            .add('```')

        const Embed = new MessageEmbed()
            .setDescription(desc.join('\n'))
        message.channel.send(Embed)
    }
}

class MessageEmbed extends OldMessageEmbed {
    constructor() {
        super()
        this.color = 3092790
    }
}

interface EventOptions {
    name: string
    description: string
    additional?: string
}

abstract class ClientEvent {
    readonly name: string
    readonly description: string
    readonly additional: string

    constructor(options: EventOptions) {
        this.name = options.name
        this.description = options.description
        this.additional = options.additional
    }

    send_help(message: Message): void {
        const desc = []
            .add('```autohotkey')
            .add(`Имя ивента: ${this.name}`)
            .add(`Описание: ${this.description}`)
            .add(`Дополнительно: ${this.additional}\n`, Boolean(this.additional))
            .add('```')

        const Embed = new MessageEmbed()
            .setDescription(desc.join('\n'))
        message.channel.send(Embed)
    }
}