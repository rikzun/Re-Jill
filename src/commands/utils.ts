import { Collection, Message, DMChannel } from 'discord.js'
import { ClientCommand, MessageEmbed, Client_Args, Client_Pars } from '../utils/classes'
import { emoji_regex, unicode_emoji_regex } from '../utils/regex'
import { emojis } from '../events/emoji_data'

const command_array = [
    class EmojiCommand extends ClientCommand {
        message: Message
        emoji_array: string[]
        matches: unknown[][]
        separator: string
        choise: number

        public constructor() {
            super({
                names: ['emoji', 'em'],
                description: 'Выводит эмодзи.',
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
                        name: 'emoji_array',
                        description: 'Строка состоящая из названий эмодзи.',
                        required: true,
                        features: 'array'
                    }
                ],
                pars: [
                    {
                        names: ['--help', '-h', '-?'],
                        description: 'Отобразить сведения об использовании.',
                        args: []
                    },
                    {
                        names: ['-s'],
                        description: 'Использовать пробелы как разделитель эмодзи.',
                        args: []
                    },
                    {
                        names: ['--choise', '-ch'],
                        description: 'Заранее выбрать возможную вариацию эмодзи.',
                        args: [
                            {
                                name: 'choise',
                                description: 'Номер выбранного варианта.',
                                type: 'Number',
                                required: true
                            }
                        ]
                    }
                ]
            })
        }

        public async execute(args: Client_Args, pars: Client_Pars): Promise<unknown> {
            this.message = args.message as Message
            this.emoji_array = this._content_fix(args.emoji_array as string[])
            this.matches = this._find_emojis()
            this.separator = ''
            delete this.choise

            for (const [par, par_args] of Object.entries(pars)) {
                switch (par) {
                    case '--help': {
                        return this._send_help(this.message)
                    }
                    case '-s': {
                        this.separator = ' '
                        break
                    }
                    case '--choise': {
                        const num = par_args.choise as number
                        if (Number.isNaN(num)) break

                        this.choise = num - 1
                        break
                    }
                }
            }

            //some emojis check
            if (!this.matches.filter(v => v.length > 1).empty) {
                const options = []
                const positions = []

                for (let i = 0; i < this.matches.length; i++) positions.push(0)

                while (true) {
                    options.push(positions.map((pos, index) => this.matches[index][pos]).join(this.separator))
                
                    let found_increment = false
                    for (let i = 0; i < positions.length; i++) {
                        positions[i]++

                        if (positions[i] < this.matches[i].length) {
                            found_increment = true
                            break
                        } else { 
                            positions[i] = 0 
                        }
                    }
                
                    if (!found_increment) break
                }
                if (this.choise !== undefined) {
                    return this.message.channel.send(options[this.choise] ?? '❌')
                } else {
                    return this._choose(options)
                }
            }

            return this.message.channel.send(this.matches.join(this.separator))
        }

        private _content_fix(emoji_array: string[]): string[] {
            const rt = []
            emoji_array.forEach(v => rt.push(...v.ssplit('\n')))
            return rt
        }

        private _find_emojis(): unknown[][] {
            const rt = []

            for (const char of this.emoji_array.map(v => v.toLocaleLowerCase())) {
                if (!char) continue

                const emoji_string_regex = char.match(emoji_regex)
                const unicode_emoji = char.match(unicode_emoji_regex)
                const matches = []

                if (emoji_string_regex) {
                    matches.push(...emojis.filter(v => 
                        v.name.toLocaleLowerCase() == emoji_string_regex[1] || v.id == emoji_string_regex[2]
                    ))
                }
                if (char.isNumber) matches.push(...emojis.filter(v => v.id == char))

                if (unicode_emoji || char == '\n') {
                    matches.push(char)
                } else {
                    matches.push(...emojis.filter(v => v.name.toLocaleLowerCase() == char))
                }

                if (matches.empty) matches.push('❌')
                rt.push(matches)
            }

            return rt
        }

        private _choose(options: string[]): void {
            const Embed = new MessageEmbed()
                .setTitle('Найдено несколько совпадений...')
                .setDescription(options.map((v, i) => `\`${i + 1}\`\n${v}\n`))
                .setFooter('В течении 20с отправьте номер варианта.')

            const sent_message = this.message.channel.send(Embed)
            const collector = this.message.channel.createMessageCollector(
                msg => msg.author.id == this.message.author.id, 
                { time: 20000 }
            )
            collector.on('collect', async (msg: Message) => {
                const num = Number(msg.content)
                if (Number.isNaN(num) || options.length < num || num < 1) return

                collector.stop()
                this.message.channel.send(options[num - 1])

                try {
                    await (await sent_message).delete()
                } catch (error) {}

                if (this.message.channel instanceof DMChannel) return
                if (this.message.channel.permissionsFor(this.message.client.user).has('MANAGE_MESSAGES')) {
                    await msg.delete()
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
]

export default command_array