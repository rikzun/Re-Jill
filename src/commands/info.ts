import { Collection, Message, MessageReaction, DMChannel, GuildEmoji, Guild, GuildMember } from 'discord.js'
import { ClientCommand, MessageEmbed, Command_Args, Command_Pars } from '../utils/classes'
import { strftime } from '../utils/functions'
import { tr } from '../utils/translate'
import { emojis } from '../events/emoji_data'
import { client } from '../bot'

const commandArray = [
    class EmojiSearchCommand extends ClientCommand {
        message: Message
        search_query: string
        target: GuildEmoji[]
        matches: GuildEmoji[]
        addinf: boolean
        buffer: string[]
        page: number

        public constructor() {
            super({
                names: ['searchemoji', 'sem'],
                description: 'Ищет указанный эмодзи.',
                additional: 'В случае отсутствия аргумента выводит список всех доступных эмодзи.' +
                'Без использования дополнительных параметров осуществляется вложенный поиск, а так же игнорируется регистр.\n' +
                '(например при поиске "yes" найдутся "Yes" и "ohYes")',
                client_perms: ['SEND_MESSAGES', 'VIEW_CHANNEL'],
                member_perms: ['SEND_MESSAGES', 'VIEW_CHANNEL'],
                args: [
                    {
                        name: 'message',
                        type: 'Message',
                        required: false
                    },
                    {
                        name: 'search_query',
                        description: 'Название эмодзи.',
                        required: false,
                        features: 'join'
                    }
                ],
                pars: [
                    {
                        names: ['--help', '-h', '-?'],
                        description: 'Отобразить сведения об использовании.'
                    },
                    {
                        names: ['--guild', '-g'],
                        description: 'Искать эмодзи только на определённом сервере.',
                        args: [
                            {
                                name: 'guild_array',
                                type: 'Guilds',
                                required: false,
                                features: 'join'
                            }
                        ]
                    },
                    {
                        names: ['-ai'],
                        description: 'Отобразить дополнительную информацию.'
                    },
                    {
                        names: ['--dont-ignore-case', '-dic'],
                        description: 'Не игнорировать регистр при поиске.'
                    },
                    {
                        names: ['--direct-search', '-ds'],
                        description: 'Искать только абсолютные совпадения.\n' +
                        '\tВ этом случае при поиске "yes" найдётся "yes", но не "Yes" или "ohYes".'
                    },
                    {
                        names: ['--delete', '-del'],
                        description: 'Удалить сообщение вызывавшее команду.'
                    }
                ]
            })
        }

        public async execute(args: Command_Args, pars: Command_Pars): Promise<unknown> {
            this.message = args.message as Message
            this.search_query = args.search_query as string ?? ''
            this.target = emojis
            this.matches = this.target.filter(v => v.name.toLocaleLowerCase().includes(this.search_query.toLocaleLowerCase()))
            this.addinf = false
            this.buffer = []
            this.page = 0

            for (const [par, par_args] of Object.entries(pars)) {
                switch (par) {
                    case '--help': {
                        return this.send_help(this.message)
                    }
                    case '-ai': {
                        this.addinf = true
                        break
                    }
                    case '--guild': {
                        const guild_array = par_args.guild_array as Guild[]

                        if (guild_array.empty) {
                            const Embed = new MessageEmbed()
                                .setDescription('🚫 Не удалось найти гильдию.')
                            return this.message.channel.send(Embed)
                        }

                        if (this.message.channel instanceof DMChannel && guild_array[0] == undefined) return

                        if (guild_array.length == 1) {
                            if (guild_array[0] == undefined) guild_array[0] = this.message.guild
                            this.target = guild_array[0].emojis.cache.array()
                            this.matches = this.target.filter(v => v.name.includes(this.search_query))
                        } else {
                            return this._choose(args, pars, guild_array)
                        }
                        break
                    }
                    case '--dont-ignore-case': {
                        this.matches = this.target.filter(v => v.name.includes(this.search_query))
                        break
                    }
                    case '--direct-search': {
                        this.matches = this.target.filter(v => v.name == this.search_query)
                        break
                    }
                    case '--delete': {
                        if (this.message.channel instanceof DMChannel) break
                        if (!this.message.channel.permissionsFor(this.message.client.user).has('MANAGE_MESSAGES')) break
                        await this.message.delete()
                        break
                    }
                }
            }

            let text = ''
            for (const emoji of this.matches) {
                const string_emoji = `<${emoji.animated ? 'a' : ''}:${emoji.name}:${emoji.id}>`
                let totext = string_emoji

                if (this.addinf) {
                    totext = string_emoji + ' ' + emoji.name + '\n' +
                    '`emoji id:` `' + emoji.id + '`\n' +
                    '`guild id:` `' + emoji.guild.id + '`\n' +
                    '`guild name:` `' + emoji.guild.name + '`\n\n'
                }

                if (text.length + totext.length > 2048) {
                    this.buffer.push(text)
                    text = ''
                    continue
                }
                text += totext
            }

            if (text) this.buffer.push(text)
            const sent_message = await this.message.channel.send(this._content())

            if (this.buffer.length > 1) {
                await sent_message.react('⏮️')
                await sent_message.react('⏪')
                await sent_message.react('⏩')
                await sent_message.react('⏭️')

                const collector = sent_message.createReactionCollector(
                    (reaction, user) => user.id == this.message.author.id, 
                    { time: 120000, dispose: true }
                )

                collector.on('collect', async(reaction: MessageReaction) => this._page_move(sent_message, reaction))
                collector.on('remove', async(reaction: MessageReaction) => this._page_move(sent_message, reaction))
                collector.on('end', async(collected: Collection<string, Message>, reason: string) => {
                    if (reason !== 'time') return
                    if (this.message.channel instanceof DMChannel) return
                    if (this.message.channel.permissionsFor(this.message.client.user).has('MANAGE_MESSAGES')) {
                        await sent_message.reactions.removeAll()
                    }
                })
            }
        }
        private _content(): MessageEmbed {
            return new MessageEmbed()
                .setTitle(`Страница ${this.buffer.length !== 0? this.page + 1 : 0}/${this.buffer.length} Всего эмодзи ${this.target.length}`)
                .setDescription(this.buffer[this.page] ?? 'пусто')
        }

        private _choose(args: Command_Args, pars: Command_Pars, guild_array: Guild[]): void {
            const Embed = new MessageEmbed()
                .setTitle('Найдено несколько совпадений...')
                .setDescription(guild_array.map((v, i) => `\`${i + 1}\` \`${v}\`\n`))
                .setFooter('В течении 20с отправьте номер варианта.')

            const sent_message = this.message.channel.send(Embed)
            const collector = this.message.channel.createMessageCollector(
                msg => msg.author.id == this.message.author.id, 
                { time: 20000 }
            )
            collector.on('collect', async (msg: Message) => {
                const num = Number(msg.content)
                if (Number.isNaN(num) || guild_array.length < num || num < 1) return

                collector.stop()
                pars['--guild'].guild_array = [guild_array[num - 1]]
                this.execute(args, pars)

                try {
                    await (await sent_message).delete()
                } catch (error) {}

                if (this.message.channel instanceof DMChannel) return
                if (!this.message.channel.permissionsFor(this.message.client.user).has('MANAGE_MESSAGES')) return
                try {
                    await msg.delete()
                } catch(error) {}
            })
            collector.on('end', async (collected: Collection<string, Message>, reason: string) => {
                if (reason !== 'time') return
                
                try {
                    await (await sent_message).delete()
                } catch (error) {}
            })
        }

        private _page_move(sent_message: Message, reaction: MessageReaction): void {
            switch (reaction.emoji.name) {
                case '⏮️': {
                    if (this.page == 0) break
                    this.page = 0

                    sent_message.edit(this._content())
                    break
                }

                case '⏪': {
                    if (this.page == 0) break
                    this.page--

                    sent_message.edit(this._content())
                    break
                }
                    
                case '⏩': {
                    if (this.page + 1 == this.buffer.length) break
                    this.page++

                    sent_message.edit(this._content())
                    break
                }

                case '⏭️': {
                    if (this.page == this.buffer.length - 1) break
                    this.page = this.buffer.length - 1

                    sent_message.edit(this._content())
                    break
                }
            }
        }
    },
    class UserCommand extends ClientCommand {
        message: Message
        members: GuildMember[]

        public constructor() {
            super({
                names: ['user'],
                description: 'Выводит информацию о пользователе.',
                additional: 'В случае отсутствия аргумента выводит информацию о вас.',
                client_perms: ['SEND_MESSAGES', 'VIEW_CHANNEL'],
                member_perms: ['SEND_MESSAGES', 'VIEW_CHANNEL'],
                owner_only: false,
                guild_only: true,
                args: [
                    {
                        name: 'message',
                        type: 'Message',
                        required: false
                    },
                    {
                        name: 'user',
                        description: 'Юзернейм, никнейм, id, либо упоминание пользователя.\n' +
                        '\t(например "Jill", "608154725338185738" или "Jill#8599")',
                        type: 'GuildMembers',
                        required: false,
                        features: 'join'
                    }
                ],
                pars: [
                    {
                        names: ['--help', '-h', '-?'],
                        description: 'Отобразить сведения об использовании.',
                        args: []
                    },
                    {
                        names: ['--delete', '-del'],
                        description: 'Удалить сообщение вызывавшее команду',
                        args: []
                    }
                ]
            })
        }

        public async execute(args: Command_Args, pars: Command_Pars): Promise<unknown> {
            this.message = args.message as Message
            this.members = args.user as GuildMember[]

            for (const [par, par_args] of Object.entries(pars)) {
                switch (par) {
                    case '--help': {
                        return this.send_help(this.message)
                    }
                    case '--delete': {
                        if (this.message.channel instanceof DMChannel) break
                        if (!this.message.channel.permissionsFor(this.message.client.user).has('MANAGE_MESSAGES')) break
                        await this.message.delete()
                        break
                    }
                }
            }

            if (this.members.empty) {
                const Embed = new MessageEmbed()
                    .setDescription('🚫 Пользователь не найден')
                return this.message.channel.send(Embed)
            }
                
            if (this.members[0] == undefined) this.members = [this.message.member]
            if (this.members.length == 1) return this._sendMessage()
            return this._choise()
        }

        private _sendMessage() {
            const member = this.members[0]
            const presence = member.user.presence
            const info: string[][] = []
        
            let platform = Object.keys(presence.clientStatus ?? []).map(e => tr(e))
            if (member.user.bot) platform = ['Бот']
        
            info[0] = []
                .add(`Псевдоним: ${member.nickname}`, member.nickname, 'Псевдоним: отсутствует')
                .add(`Пользователь: ${member.user.tag}`)
                .add(`Регистрация: ${strftime(member.user.createdTimestamp, '%d.%m.%y %H:%M:%S')}`)
                .add(`Подключение: ${strftime(member.joinedTimestamp, '%d.%m.%y %H:%M:%S')}`)
                .add(`Платформа: ${platform.join(', ')}`, platform.length)
                .add(`ID: ${member.id}`)

            info[1] = []
            for (const activity of presence.activities) {
                if (activity.type == 'CUSTOM_STATUS') {
                    info[1].push(activity.state.replace(/```/g, ''))
                    continue
                }
        
                const activityForm = []
                    .add(tr(activity.type) + ' ' + activity.name)
                    .add(activity.details, activity.details)
                    .add(activity.state, activity.state)
                info[1].push(activityForm.join('\n'))
            }
        
            const Embed = new MessageEmbed()
                .setThumbnail(member.user.displayAvatarURL({format: 'png', dynamic: true, size: 4096}))
                .addField('Общее', '```\n' + info[0].join('\n') + '```')
        
            if (!info[1].empty) Embed.addField('Активность', info[1].map(v => '```\n' + v + '```').join(''))
        
            this.message.channel.send(Embed)
        }

        private _choise(): void {
            const Embed = new MessageEmbed()
                .setTitle('Найдено несколько совпадений...')
                .setDescription(this.members.map((e, i) => `\`${i}\`: ` + e.toString()))
                .setFooter('В течении 20с отправьте номер пользователя.')
            this.message.channel.send(Embed)
        
            const collector = this.message.channel.createMessageCollector(
                msg => msg.author.id == this.message.author.id, 
                { time: 20000 }
            )
        
            collector.on('collect', async(message: Message) => {
                const num = Number(message)
                if (Number.isNaN(num) || this.members.length < num || num < 1) return

                collector.stop()
                this.members = [this.members[num - 1]]
                this._sendMessage()
            })
        }
    },
    class ManualCommand extends ClientCommand {
        message: Message
        name: string

        public constructor() {
            super({
                names: ['manual'],
                description: 'Вызывает сообщение содержащее все команды.',
                additional: 'В случае передачи аргумента выводит его справочную информацию.',
                client_perms: ['SEND_MESSAGES', 'VIEW_CHANNEL'],
                member_perms: ['SEND_MESSAGES', 'VIEW_CHANNEL'],
                args: [
                    {
                        name: 'message',
                        type: 'Message',
                        required: false
                    },
                    {
                        name: 'name',
                        description: 'Название команды, или ивента',
                        required: false,
                        features: 'join'
                    }
                ],
                pars: [
                    {
                        names: ['--help', '-h', '-?'],
                        description: 'Отобразить сведения об использовании.'
                    }
                ]
            })
        }

        public async execute(args: Command_Args, pars: Command_Pars): Promise<unknown> {
            this.message = args.message as Message
            this.name = args.name as string

            for (const [par, par_args] of Object.entries(pars)) {
                switch (par) {
                    case '--help': {
                        return this.send_help(this.message)
                    }
                }
            }

            if (this.name) {
                const target = []
                target.push(...client.commands.filter(v => v.names.includes(this.name)))
                target.push(...client.events.filter(v => v.name == this.name))

                if (target.empty) {
                    const Embed = new MessageEmbed().setDescription('🚫 Нет совпадений.')
                    return this.message.channel.send(Embed)
                }

                return target[0].send_help(this.message)
            }

            const array = []
                .add(client.commands.map(v => '```\n' + `${v.names[0]}\n${v.description}` + '```').join(''))
                .add(client.events.map(v => '```\n' + `${v.name}\n${v.description}` + '```').join(''))

            const Embed = new MessageEmbed()
                .setDescription(array.join(''))
            this.message.channel.send(Embed)
        }
    },
    class HelpCommand extends ClientCommand {
        message: Message

        public constructor() {
            super({
                names: ['help'],
                description: 'Выводит справочную информацию об использованию бота.',
                client_perms: ['SEND_MESSAGES', 'VIEW_CHANNEL'],
                member_perms: ['SEND_MESSAGES', 'VIEW_CHANNEL'],
                args: [
                    {
                        name: 'message',
                        type: 'Message',
                        required: false
                    }
                ],
                pars: [
                    {
                        names: ['--help', '-h', '-?'],
                        description: 'Отобразить сведения об использовании.'
                    }
                ]
            })
        }

        public async execute(args: Command_Args, pars: Command_Pars): Promise<unknown> {
            this.message = args.message as Message

            for (const [par, par_args] of Object.entries(pars)) {
                switch (par) {
                    case '--help': {
                        return this.send_help(this.message)
                    }
                }
            }

            const info = [
                '```',
                'Что бы использовать команды бота перед их именем следует писать префикс бота:',
                `${client.prefix}команда\n`,
                'Так же командам зачастую требуются аргументы, аргументами является любые символы идущие после имени команды, например:',
                `${client.prefix}команда аргумент\n`,
                'Посмотреть требуемые аргументы, как и другую информацию о требуемой команде можно с помощью параметра --help:',
                `${client.prefix}команда --help\n`,
                'Теперь поговорим о параметрах, параметрами являются любые символы, начинающиеся с одного, или двух знаков минуса (-).',
                'Обычно параметры пишутся после аргументов, если таковые имеются, но некоторые параметры можно использовать и игнорируя все аргументы, к примеру --help.',
                `Теперь когда вы разобрались в том, как пользоваться данным ботом - используйте команду ${client.prefix}manual для получения списка команд.`,
                '```'
            ]
                
            const Embed = new MessageEmbed()
                .setDescription(info.join('\n'))
            this.message.channel.send(Embed)
        }
    }
]
export default commandArray