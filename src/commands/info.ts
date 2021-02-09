import { Collection, GuildEmoji, Message, MessageReaction } from 'discord.js'
import { ClientCommand, CommandOptions, MessageEmbed } from '../utils/classes'
import { emojis } from '../events/emojiData'
import { emojiRegex, unicodeEmojiRegex } from '../utils/regex'

const commandArray = [
    class EmojiSearchCommand extends ClientCommand {
        page: number
        buffer: string[]

        public constructor() {
            const options = new CommandOptions({
                aliases: ['searchemoji', 'sem'],
                description: 'Ищет требуемый эмодзи.',
                args: [
                    {
                        name: 'searchQuery',
                        description: 'Запрос поиска.',
                        required: false,
                        features: 'join'
                    }
                ],
                parameters: [
                    {
                        aliases: ['--help', '-h'],
                        description: 'Отображение сведений об использовании.',
                        execute: (message: Message)=>{ return this.sendHelp(message) }
                    }
                ]
            })
            super(options)

            this.page = 0
            this.buffer = []
        }

        public clear() {}

        public async execute(message: Message, searchQuery: string) {
            if (!searchQuery) searchQuery = ''
            const matches = emojis.filter(v => v.name.includes(searchQuery))

            let text = ''
            for (const emoji of matches) {
                const stringEmoji = `<${emoji.animated ? 'a' : ''}:${emoji.name}:${emoji.id}>`
                
                if (text.length + stringEmoji.length > 2048) {
                    this.buffer.push(text)
                    text = ''
                    continue
                }
                text += stringEmoji
            }

            if (text) this.buffer.push(text)

            const sentMessage = await message.channel.send(this._content())

            if (this.buffer.length > 1) {
                await sentMessage.react('⏮️')
                await sentMessage.react('⏪')
                await sentMessage.react('⏩')
                await sentMessage.react('⏭️')

                const collector = sentMessage.createReactionCollector(
                    (reaction, user) => user.id == message.author.id, 
                    { time: 120000, dispose: true }
                )
                
                collector.on('collect', async(reaction: MessageReaction) => this._pageMove(reaction, sentMessage))
                collector.on('remove', async(reaction: MessageReaction) => this._pageMove(reaction, sentMessage))
                collector.on('end', async(collected: Collection<string, Message>, reason: string) => {
                    if (reason !== 'time') return
                    try {
                        await sentMessage.reactions.removeAll()
                    } catch (error) {}
                })
            }
        }

        private _content(): MessageEmbed {
            return new MessageEmbed()
                .setTitle(`Страница ${this.page+1}/${this.buffer.length}`)
                .setDescription(this.buffer[this.page])
        }

        private async _pageMove(reaction: MessageReaction, sentMessage: Message): Promise<void> {
            switch (reaction.emoji.name) {
                case '⏮️': {
                    if (this.page == 0) break
                    this.page = 0

                    await sentMessage.edit(this._content())
                    break
                }

                case '⏪': {
                    if (this.page == 0) break
                    this.page--

                    await sentMessage.edit(this._content())
                    break
                }
                    
                case '⏩': {
                    if (this.page + 1 == this.buffer.length) break
                    this.page++

                    await sentMessage.edit(this._content())
                    break
                }

                case '⏭️': {
                    if (this.page == this.buffer.length - 1) break
                    this.page = this.buffer.length - 1

                    await sentMessage.edit(this._content())
                    break
                }
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