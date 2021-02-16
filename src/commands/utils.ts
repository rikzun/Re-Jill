import { Collection, Message, DMChannel } from 'discord.js'
import { ClientCommand, MessageEmbed, Command_Args, Command_Pars } from '../utils/classes'
import { emoji_regex, unicode_emoji_regex } from '../utils/regex'
import { emojis } from '../events/emoji_data'

const command_array = [
    class EmojiCommand extends ClientCommand {
        message: Message
        emoji_array: string[]
        matches: unknown[][]
        separator: string
        choise: number
        ignore_case: boolean

        public constructor() {
            super({
                names: ['emoji', 'em'],
                description: 'Выводит указанный эмодзи.',
                additional: 'Без использования дополнительных параметров осуществляется точный поиск с игнорированием регистра.\n' +
                '(например при поиске "yes" найдётся "Yes", но не "ohYes")',
                client_perms: ['SEND_MESSAGES', 'VIEW_CHANNEL'],
                member_perms: ['SEND_MESSAGES', 'VIEW_CHANNEL'],
                args: [
                    {
                        name: 'message',
                        type: 'Message',
                        required: false
                    },
                    {
                        name: 'emoji_array',
                        description: 'Эмодзи, точные имена эмодзи, либо их ID. Так же поддерживаются стандартные эмодзи.\n' +
                        '\t(например "trololo", "801454131101302814" или "👍🏿")',
                        required: true,
                        features: 'array'
                    }
                ],
                pars: [
                    {
                        names: ['--help', '-h', '-?'],
                        description: 'Отобразить сведения об использовании.'
                    },
                    {
                        names: ['-s'],
                        description: 'Использовать пробелы как разделитель эмодзи.'
                    },
                    {
                        names: ['--choise', '-ch'],
                        description: 'Заранее выбрать возможную вариацию эмодзи.',
                        args: [
                            {
                                name: 'choise',
                                type: 'Number',
                                required: true
                            }
                        ]
                    },
                    {
                        names: ['--dont-ignore-case', '-dic'],
                        description: 'Не игнорировать регистр при поиске.'
                    },
                    {
                        names: ['--delete', '-del'],
                        description: 'Удалить сообщение вызывавшее команду'
                    }
                ]
            })
        }

        public async execute(args: Command_Args, pars: Command_Pars): Promise<unknown> {
            this.message = args.message as Message
            this.ignore_case = true
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
                    case '--dont-ignore-case': {
                        this.ignore_case = false
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

            this.emoji_array = this._content_fix(args.emoji_array as string[])
            this.matches = this._find_emojis()

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

            for (const char of this.emoji_array) {
                if (!char) continue

                const unicode_emoji = char.match(unicode_emoji_regex)
                const emoji_string_regex = char.match(emoji_regex)
                const matches = []

                if (unicode_emoji || char == '\n') matches.push(char)
                if (this.ignore_case) {
                    if (emoji_string_regex) {
                        matches.push(...emojis.filter(v => 
                            v.name.toLocaleLowerCase() == emoji_string_regex[1].toLocaleLowerCase() || v.id == emoji_string_regex[2]
                        ))
                    }

                    matches.push(...emojis.filter(v => 
                        v.name.toLocaleLowerCase() == char.toLocaleLowerCase() ||
                        v.id == char
                    ))
                } else {
                    if (emoji_string_regex) {
                        matches.push(...emojis.filter(v => 
                            v.name == emoji_string_regex[1] || v.id == emoji_string_regex[2]
                        ))
                    }

                    matches.push(...emojis.filter(v => 
                        v.name == char ||
                        v.id == char
                    ))
                }

                rt.push(!matches.empty ? matches : ['❌'])
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