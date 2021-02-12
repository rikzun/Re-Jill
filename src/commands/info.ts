import { Collection, Message, MessageReaction, DMChannel, GuildEmoji, Guild } from 'discord.js'
import { ClientCommand, MessageEmbed, Client_Args, Client_Pars } from '../utils/classes'
import { emojis } from '../events/emoji_data'

const commandArray = [
    class EmojiSearchCommand extends ClientCommand {
        public constructor() {
            super({
                names: ['searchemoji', 'sem'],
                description: 'Ищет требуемый эмодзи.',
                client_perms: [],
                member_perms: [],
                owner_only: false,
                guild_only: false,
                args: [
                    {
                        name: 'message',
                        description: 'Экземпляр сообщения.',
                        type: 'Message',
                        required: false
                    },
                    {
                        name: 'search_query',
                        description: 'Запрос поиска.',
                        required: false,
                        features: 'join'
                    }
                ],
                pars: [
                    {
                        names: ['--help', '-h', '-?'],
                        description: 'Отображение сведений об использовании.',
                        args: []
                    },
                    {
                        names: ['--guild', '-g'],
                        description: 'Поиск эмодзи с определённого сервера.',
                        args: [
                            {
                                name: 'guild_array',
                                description: 'Имя, либо id гильдии.',
                                type: 'Guilds',
                                required: true,
                                features: 'join'
                            }
                        ]
                    },
                    {
                        names: ['-ai'],
                        description: 'Отображение дополнительной информации.',
                        args: []
                    },
                    {
                        names: ['--ignore-case', '-ic'],
                        description: 'При поиске игнорировать регистр.',
                        args: []
                    },
                    {
                        names: ['--direct-search', '-ds'],
                        description: 'Искать абсолютные совпадения.',
                        args: []
                    }
                ]
            })
        }

        public async execute(args: Client_Args, pars: Client_Pars): Promise<unknown> {
            const message = args.message as Message
            const search_query = args.search_query as string ?? ''
            let target = emojis
            let matches = target.filter(v => v.name.includes(search_query))
            let addinf = false

            for (const [par, par_args] of Object.entries(pars)) {
                switch (par) {
                    case '--help': return this.send_help(message)
                    case '-ai': addinf = true; break
                    case '--guild': {
                        const guild_array = par_args.guild_array as Guild[]

                        if (guild_array.empty) {
                            const Embed = new MessageEmbed()
                                .setDescription('🚫 Не удалось найти гильдию.')
                            return message.channel.send(Embed)
                        }

                        if (guild_array.length == 1) {
                            target = guild_array[0].emojis.cache.array()
                            matches = target.filter(v => v.name.includes(search_query))
                        } else {
                            return choose(message, guild_array)
                        }
                        break
                    }
                    case '--ignore-case': {
                        matches = target.filter(v => v.name.toLocaleLowerCase().includes(search_query.toLocaleLowerCase()))
                        break
                    }
                    case '--direct-search': {
                        matches = target.filter(v => v.name == search_query)
                        break
                    }
                }
            }

            const buffer = []
            let page = 0
            let text = ''
            for (const emoji of matches) {
                const string_emoji = `<${emoji.animated ? 'a' : ''}:${emoji.name}:${emoji.id}>`
                let totext = string_emoji

                if (addinf) {
                    totext = string_emoji + ' ' + emoji.name + '\n' +
                    '`emoji id:` `' + emoji.id + '`\n' +
                    '`guild id:` `' + emoji.guild.id + '`\n' +
                    '`guild name:` `' + emoji.guild.name + '`\n\n'
                }

                if (text.length + totext.length > 2048) {
                    buffer.push(text)
                    text = ''
                    continue
                }
                text += totext
            }

            if (text) buffer.push(text)
            const sent_message = await message.channel.send(content())

            if (buffer.length > 1) {
                await sent_message.react('⏮️')
                await sent_message.react('⏪')
                await sent_message.react('⏩')
                await sent_message.react('⏭️')

                const collector = sent_message.createReactionCollector(
                    (reaction, user) => user.id == message.author.id, 
                    { time: 120000, dispose: true }
                )
                
                collector.on('collect', async(reaction: MessageReaction) => page_move(reaction))
                collector.on('remove', async(reaction: MessageReaction) => page_move(reaction))
                collector.on('end', async(collected: Collection<string, Message>, reason: string) => {
                    if (reason !== 'time') return
                    if (!(message.channel instanceof DMChannel)) {
                        const channel_permissions = message.channel.permissionsFor(message.client.user)
    
                        if (channel_permissions.has('MANAGE_MESSAGES')) {
                            await sent_message.reactions.removeAll()
                        }
                    }
                })

                async function page_move(reaction: MessageReaction): Promise<void> {
                    switch (reaction.emoji.name) {
                        case '⏮️': {
                            if (page == 0) break
                            page = 0
        
                            await sent_message.edit(content())
                            break
                        }
        
                        case '⏪': {
                            if (page == 0) break
                            page--
        
                            await sent_message.edit(content())
                            break
                        }
                            
                        case '⏩': {
                            if (page + 1 == buffer.length) break
                            page++
        
                            await sent_message.edit(content())
                            break
                        }
        
                        case '⏭️': {
                            if (page == buffer.length - 1) break
                            page = buffer.length - 1
        
                            await sent_message.edit(content())
                            break
                        }
                    }
                }
            }

            function content(): MessageEmbed {
                return new MessageEmbed()
                    .setTitle(`Страница ${buffer.length !== 0? page+1 : 0}/${buffer.length} Всего эмодзи ${target.length}`)
                    .setDescription(buffer[page] ?? 'пусто')
            }
            function choose(message: Message, guild_array: Guild[]): void {
                const Embed = new MessageEmbed()
                    .setTitle('Найдено несколько совпадений...')
                    .setDescription(guild_array.map((v, i) => `\`${i + 1}\` \`${v}\`\n`))
                    .setFooter('В течении 20с отправьте номер варианта.')
    
                const sent_message = message.channel.send(Embed)
                const collector = message.channel.createMessageCollector(
                    msg => msg.author.id == message.author.id, 
                    { time: 20000 }
                )
                collector.on('collect', async (msg: Message) => {
                    if (!msg.content.isNumber && !guild_array[Number(msg.content) - 1]) return
    
                    collector.stop()
                    pars['--guild'].guild_array = [guild_array[Number(msg.content) - 1]]
                    this.execute(args, pars)
    
                    try {
                        await (await sent_message).delete()
                    } catch (error) {}
    
                    if (!(message.channel instanceof DMChannel)) {
                        const channel_permissions = message.channel.permissionsFor(message.client.user)
    
                        if (channel_permissions.has('MANAGE_MESSAGES')) {
                            await msg.delete()
                        }
                    }
                })
                collector.on('end', async (collected: Collection<string, Message>, reason: string) => {
                    if (reason !== 'time') return
                    
                    try {
                        await (await sent_message).delete()
                    } catch (error) {}
                })
            }
        }
    }
]
export default commandArray

// const commands: RawCommand[] = [
//     {
//         aliases: ['user'],
//         args: {'gmrt*': 'GuildMember'},
//         guildOnly: true,
//         execute: async (message: Message, members: GuildMember[]) => {
//             if (members.empty) {
//                 const Embed = new MessageEmbed()
//                     .setDescription('🚫 Пользователь не найден')
//                 return message.channel.send(Embed)
//             }

//             if (members[0] == undefined) members = [message.member]
            
//             if (members.length > 1) {
//                 const Embed = new MessageEmbed()
//                     .setTitle('Найдено несколько совпадений...')
//                     .setDescription(members.map((e, i) => `\`${i}\`: ` + e.toString()))
//                     .setFooter('В течении 20с отправьте номер пользователя.')
//                 message.channel.send(Embed)

//                 const collector = message.channel.createMessageCollector(
//                     msg => msg.author.id == message.author.id, 
//                     { time: 20000 }
//                 )
    
//                 collector.on('collect', msg => {
//                     if (msg.content.isNumber() && members[msg.content]) {
//                         members = [members[msg.content]]
//                         sendMessage()
//                         collector.stop()
//                     }
//                 })
//             } else { sendMessage() }

//             async function sendMessage() {
//                 const member = members[0]
//                 const presence = member.user.presence
//                 const description = []
//                 const activities = []

//                 let platform = Object.keys(presence.clientStatus ?? []).map(e => tr(e))
//                 if (member.user.bot) platform = ['Бот']

//                 description
//                     .add(`Псевдоним: ${member.nickname}`, member.nickname)
//                     .add(`Пользователь: ${member.user.tag}`)
//                     .add(`Регистрация: ${strftime(member.user.createdTimestamp, '%d.%m.%y %H:%M:%S')}`)
//                     .add(`Подключение: ${strftime(member.joinedTimestamp, '%d.%m.%y %H:%M:%S')}`)
//                     .add(`Платформа: ${platform.join(', ')}`, platform.length)
//                     .add(`ID: ${member.id}`)

//                 for (const activity of presence.activities) {
//                     if (activity.type == 'CUSTOM_STATUS') {
//                         activities.push([activity.state])
//                         continue
//                     }

//                     const activityForm = []
//                         .add(tr(activity.type) + ' ' + activity.name)
//                         .add(activity.details, activity.details)
//                         .add(activity.state, activity.state)
//                     activities.push(activityForm.join('\n'))
//                 }

//                 const Embed = new MessageEmbed()
//                     .setThumbnail(member.user.displayAvatarURL({format: 'png', dynamic: true, size: 4096}))
//                     .addField('Общее', '```\n' + description.join('\n') + '```')

//                 if (activities.length) Embed.addField('Активность', activities.map(a => '```\n' + a + '```').join(''))

//                 message.channel.send(Embed)
//             }
//         }
//     },
//     {
//         aliases: ['help', '?'],
//         execute: async (message: Message) => {
//             const Embed = new MessageEmbed()
//                 .setDescription('Информация о командах описана на [сайте](https://github.com/RikZun/Re-Jill/wiki) бота')

//             message.channel.send(Embed)
//         }
//     }
// ]
// export default commands