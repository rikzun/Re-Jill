import { Collection, Message } from 'discord.js'
import { ClientCommand, CommandOptions, MessageEmbed } from '../utils/classes'
import { emojis } from '../events/emojiData'
import { emojiRegex, unicodeEmojiRegex } from '../utils/regex'

const commandArray = [
    class EmojiCommand extends ClientCommand {
        separator: string

        public constructor() {
            const options = new CommandOptions({
                aliases: ['emoji', 'em'],
                description: 'Выводит эмодзи.',
                args: [
                    {
                        name: 'emojiArray',
                        description: 'Строка из эмодзи.',
                        required: true,
                        features: 'array'
                    }
                ],
                parameters: [
                    {
                        aliases: ['--help', '-h'],
                        description: 'Отображение сведений об использовании.',
                        execute: (message: Message)=>{ return this.sendHelp(message) }
                    },
                    {
                        aliases: ['-s'],
                        description: 'Использовать пробелы в сообщении.',
                        execute: (message: Message)=>{ this.separator = ' ' }
                    }
                ]
            })
            super(options)

            this.separator = ''
        }

        public async execute(message: Message, emojiArray: string[]): Promise<void> {
            this.separator = ''

            emojiArray = this._contentFix(emojiArray)
            const rt = []

            for (const char of emojiArray.map(v => v.toLocaleLowerCase())) {
                if (!char) continue

                const emojiStringRegex = char.match(emojiRegex)
                const unicodeEmoji = char.match(unicodeEmojiRegex)
                const matches = []

                if (emojiStringRegex) {
                    matches.push(...emojis.filter(v => 
                        v.name.toLocaleLowerCase() == emojiStringRegex[1].toLocaleLowerCase() || v.id == emojiStringRegex[2]
                    ))
                }
                if (char.isNumber) matches.push(...emojis.filter(v => v.id == char))

                if (unicodeEmoji || char == '\n') {
                    matches.push(char)
                } else {
                    matches.push(...emojis.filter(v => v.name.toLocaleLowerCase() == char.toLocaleLowerCase()))
                }

                if (matches.empty) matches.push('❌')
                
                rt.push(matches)
            }

            //some emojis
            if (!rt.filter(v => v.length > 1).empty) {
                const options = []
                const positions = []

                for (let i = 0; i < rt.length; i++) positions.push(0)

                while (true) {
                    options.push(positions.map((pos, index) => rt[index][pos]).join(this.separator))
                
                    let found_increment = false
                    for (let i = 0; i < positions.length; i++) {
                        positions[i]++

                        if (positions[i] < rt[i].length) {
                            found_increment = true
                            break
                        } else { positions[i] = 0 }
                    }
                
                    if (!found_increment) break
                }
                return this._choose(message, options)
            }
            
            return this._send(message, rt.join(this.separator))
        }

        private _send(message: Message, text: string): void {
            message.channel.send(text)
        }

        private _contentFix(emojiArray: string[]): string[] {
            const rt = []
            emojiArray.forEach(v => rt.push(...v.ssplit('\n')))
            return rt
        }

        private _choose(message: Message, options: string[]): void {
            const Embed = new MessageEmbed()
                .setTitle('Найдено несколько совпадений...')
                .setDescription(options.map((v, i) => `\`${i + 1}\`\n${v}\n`))
                .setFooter('В течении 20с отправьте номер варианта.')

            const sentMessage = message.channel.send(Embed)

            const collector = message.channel.createMessageCollector(
                msg => msg.author.id == message.author.id, 
                { time: 20000 }
            )
            collector.on('collect', async (msg: Message) => {
                if (!msg.content.isNumber && !options[Number(msg.content) - 1]) return

                collector.stop()
                this._send(message, options[Number(msg.content) - 1])

                try {
                    await (await sentMessage).delete()
                    await msg.delete()
                } catch (e) {}
            })
            collector.on('end', async (collected: Collection<string, Message>, reason: string) => {
                if (reason !== 'time') return
                
                try {
                    await (await sentMessage).delete()
                } catch (e) {}
            })
        }
    }
]

export default commandArray