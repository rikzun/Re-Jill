import { EmbedBuilder as OldEmbedBuilder, Message, EmbedData, APIEmbed, PermissionFlagsBits } from 'discord.js'
import { tr } from './translate'
export { 
    Command, CommandOptions, EmbedBuilder, Command_Args, 
    Command_Pars, Constructors, Argument, ClientEvent
}

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

    required?: boolean
    type?: Constructors

    features?: Features

    value?: unknown
    values_array?: unknown[]
}

class Argument {
    readonly name: string
    readonly description: string

    readonly required: boolean
    readonly type: Constructors

    readonly features: Features

    readonly value: unknown
    readonly values_array: unknown[]

    constructor(cmd_arg: Command_Argument) {
        this.name = cmd_arg.name
        this.description = cmd_arg.description

        this.required = cmd_arg.required ?? false
        this.type = cmd_arg.type

        this.features = cmd_arg.features
        
        this.value = cmd_arg.value
        this.values_array = cmd_arg.values_array
    }
}

interface Command_Parameter {
    names: string[]
    description?: string
    args?: Command_Argument[]
}

class Parameter {
    readonly names: string[]
    readonly description: string
    readonly args: Argument[]

    constructor(cmd_par: Command_Parameter) {
        this.names = cmd_par.names
        this.description = cmd_par.description ?? 'Описание отсутствует'
        this.args = (cmd_par.args ?? []).map(v => new Argument(v))
    }
}

interface Command_Args { [arg_name: string]: unknown }
interface Command_Pars { [par_name: string]: Command_Args }

type PermissionString = keyof typeof PermissionFlagsBits;

interface CommandOptions {
    names: string[]
    description?: string
    additional?: string

    client_perms?: PermissionString[]
    member_perms?: PermissionString[]

    owner_only?: boolean
    guild_only?: boolean

    args?: Command_Argument[]
    pars?: Command_Parameter[]
}

abstract class Command {
    readonly names: string[]
    readonly description: string
    readonly additional: string

    readonly client_perms: PermissionString[]
    readonly member_perms: PermissionString[]

    readonly owner_only: boolean
    readonly guild_only: boolean

    readonly args: Argument[]
    readonly pars: Parameter[]
    
    constructor(options: CommandOptions) {
        this.names = options.names
        this.description = options.description ?? 'отсутствует'
        this.additional = options.additional

        this.client_perms = ['SendMessages', 'ViewChannel', ...options.client_perms ?? []]
        this.member_perms = ['SendMessages', 'ViewChannel', ...options.member_perms ?? []]

        this.owner_only = options.owner_only ?? false
        this.guild_only = options.guild_only ?? false

        if (!options.args) options.args = []
        if (!options.pars) options.pars = []

        this.args = options.args.map(v => new Argument(v))

        options.pars.push(
            {names: ['--help', '-h', '-?'], description: 'Отобразить сведения об использовании.'},
            {names: ['--delete', '-del', '-d'], description: 'Удалить сообщение вызывавшее команду.'}
        )
        this.pars = options.pars.map(v => new Parameter(v))
    }

    abstract execute(args: Command_Args, pars: Command_Pars): Promise<unknown>
    send_help(message: Message): void {
        function normalize(arg: Argument): string {
            let name = arg.name
            let rt = '  '

            if (arg.features == 'array') name = '...' + name
            if (arg.features == 'join') name += '*'
            if (!arg.required) name += '?'

            rt += `Аргумент: <${name}>`
            if(arg.description) rt += '\nОписание: ' + arg.description.split('\n').join('\n  ')

            if (arg.value) rt += '\nЗначение по умолчанию: ' + arg.value
            if (arg.values_array) rt += '\nДоступные значения: ' + arg.values_array.join(' | ')

            return rt.split('\n').join('\n  ')
        }

        function normalizePar(par: Parameter) {
            let rt = '  '

            rt += 'Параметр: ' + par.names.join(', ')
            if (par.description) rt += '\nОписание: ' + par.description
            if (!par.args.empty) rt += '\nАргументы:\n' + par.args.map(v => normalize(v)).join('\n')

            return rt.split('\n').join('\n  ')
        }

        const Embed = new EmbedBuilder()
            .setDescription([]
                .add('```autohotkey')
                .add(`Имена команды: ` + this.names.join(', '))
                .add(`Описание: ` + this.description)
                .add(`Дополнительно: ` + this.additional, this.additional ?? false)
                .add('\nАргументы:\n' + this.args.map(v => normalize(v)).join('\n'), !this.args.empty, 'Аргументы:\n  отсутствуют')
                .add('\nПараметры:\n' + this.pars.map(v => normalizePar(v)).join('\n\n'), !this.pars.empty, 'Параметры:\n  отсутствуют')
                .add('\nТребуемые права:', !this.client_perms.empty || this.member_perms.empty)
                .add(`  Бота:\n${this.client_perms.map(v => `\t${tr(v)}`).join(',\n')}\n`, !this.client_perms.empty)
                .add(`  Пользователя:\n${this.member_perms.map(v => `\t${tr(v)}`).join(',\n')}\n`, !this.member_perms.empty)
                .add('```').join('\n'))
        message.channel.send({ embeds: [Embed] })
    }
}

class EmbedBuilder extends OldEmbedBuilder {
    constructor(data?: EmbedData | APIEmbed) {
        super(data)
        this.setColor('#2f3136')
    }

    public addField(name: string, value: string, inline: boolean = false): this {
        return this.addFields([{ name, value, inline }]);
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

        const Embed = new EmbedBuilder()
            .setDescription(desc.join('\n'))
        message.channel.send({ embeds: [Embed] })
    }
}