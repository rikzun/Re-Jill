import { Collection, Message } from 'discord.js'
import { Command, EmbedBuilder, Command_Args, Command_Pars } from '../utils/classes'
import { emoji_regex, unicode_emoji_regex, message_link } from '../utils/regex'
import { emojis } from '../events/emoji_data'
import { fetchMessageLink } from '../utils/functions'

const command_array = [
    class EmojiCommand extends Command {
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
                args: [
                    {
                        name: 'emoji_array',
                        description: 'Эмодзи, точные имена эмодзи, либо их ID.\nТак же поддерживаются стандартные эмодзи.\n' +
                        '(например "trololo", "801454131101302814" или "👍🏿")',
                        required: true,
                        features: 'array'
                    }
                ],
                pars: [
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
                    }
                ],
                client_perms: ['UseExternalEmojis']
            })
        }

        public async execute(args: Command_Args, pars: Command_Pars) {
            this.message = args.message as Message
            this.ignore_case = true
            this.separator = ''
            this.emoji_array = this._content_fix(args.emoji_array as string[])
            this.matches = this._find_emojis()
            delete this.choise

            for (const [par, par_args] of Object.entries(pars)) {
                switch (par) {
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
                }
            }

            //some emojis check
            if (!this.matches.filter(v => v.length > 1).empty) {
                const options = []
                const positions = []

                for (let i = 0; i < this.matches.length; i++) positions.push(0)

                while (true) {
                    if (options.length > 10) return

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

            return this.message.channel.send(this.matches.join(this.separator).replace(/\n\s/g, '\n'))
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

        private _choose(options: string[]): unknown {
            const Embed = new EmbedBuilder()
                .setTitle('Найдено несколько совпадений...')
                .setDescription(options.map((v, i) => `\`${i + 1}\`\n${v}\n`).join('\n'))
                .setFooter({ text: 'В течении 20с отправьте номер варианта.' })

            if (Embed.data.description.length >= 6000) return this.message.react('❌')

            const sent_message = this.message.channel.send({ embeds: [Embed] })
            const collector = this.message.channel.createMessageCollector({
                filter: msg => msg.author.id == this.message.author.id, 
                time: 20000
            })
            collector.on('collect', async (msg: Message) => {
                const num = Number(msg.content)
                if (Number.isNaN(num) || options.length < num || num < 1) return

                collector.stop()
                this.message.channel.send(options[num - 1])

                try {
                    await (await sent_message).delete()
                } catch (error) {}

                if (this.message.channel.isDMBased()) return
                if (this.message.channel.permissionsFor(this.message.client.user).has('ManageMessages')) {
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
    },
    class TextToEmojiCommand extends Command {
        message: Message
        text: string[]
        dictionary: {
            [character: string]: string
        }

        public constructor() {
            super({
                names: ['tte'],
                description: 'Переводит текст в эмодзи.',
                additional: 'Работает только с английскими символами и цифрами.',
                args: [
                    {
                        name: 'text',
                        description: 'Английские буквы и/или цифры.',
                        required: true,
                        features: 'join'
                    }
                ]
            })

            this.dictionary = {
                'a': ':regional_indicator_a:', 'b': ':regional_indicator_b:', 'c': ':regional_indicator_c:', 'd': ':regional_indicator_d:', 'e': ':regional_indicator_e:',
                'f': ':regional_indicator_f:', 'g': ':regional_indicator_g:', 'h': ':regional_indicator_h:', 'i': ':regional_indicator_i:', 'j': ':regional_indicator_j:',
                'k': ':regional_indicator_k:', 'l': ':regional_indicator_l:', 'm': ':regional_indicator_m:', 'n': ':regional_indicator_n:', 'o': ':regional_indicator_o:',
                'p': ':regional_indicator_p:', 'q': ':regional_indicator_q:', 'r': ':regional_indicator_r:', 's': ':regional_indicator_s:', 't': ':regional_indicator_t:',
                'u': ':regional_indicator_u:', 'v': ':regional_indicator_v:', 'w': ':regional_indicator_w:', 'x': ':regional_indicator_x:', 'y': ':regional_indicator_y:',
                'z': ':regional_indicator_z:', ' ': ' ', '\n': '\n',
                '0': ':zero:', '1': ':one:', '2': ':two:', '3': ':three:', '4': ':four:',
                '5': ':five:', '6': ':six:', '7': ':seven:', '8': ':eight:', '9': ':nine:'
            }
        }

        public async execute(args: Command_Args, pars: Command_Pars) {
            this.message = args.message as Message
            this.text = Array.from((args.text as string).toLocaleLowerCase())

            const rt = []
            for (const char of this.text) {
                if (!this.dictionary.hasOwnProperty(char)) continue
                rt.push(this.dictionary[char])
            }
            const text = rt.join(' ').replace(/\n\s/g, '\n')

            if (text.replace(/\s/g, '') == '') {
                const Embed = new EmbedBuilder()
                    .setDescription('🚫 Указанные символы не поддерживаются.')
                return this.message.channel.send({ embeds: [Embed] })
            }
            if (text.length >= 2000) {
                const Embed = new EmbedBuilder()
                    .setDescription('🚫 Сообщение слишком большое.')
                return this.message.channel.send({ embeds: [Embed] })
            }

            await this.message.channel.send(text)
        }
    },
    class TranslateWrongLayoutCommand extends Command {
        message: Message
        text: string[]
        dictionary: {
            [character: string]: string
        }

        public constructor() {
            super({
                names: ['twl'],
                description: 'Переводит ntrcn в текст.',
                additional: 'Работает только с английскими символами и цифрами.',
                args: [
                    {
                        name: 'text',
                        description: 'Текст, либо ссылка на сообщение.',
                        required: true,
                        features: 'join'
                    }
                ]
            })

            this.dictionary = {
                'f': 'а', 'F': 'А', ',': 'б', '<': 'Б', 'd': 'в',
                'D': 'В', 'u': 'г', 'U': 'Г', 'l': 'д', 'L': 'Д',
                't': 'е', 'T': 'Е', '`': 'ё', '~': 'Ё', ';': 'ж',
                ':': 'Ж', 'p': 'з', 'P': 'З', 'b': 'и', 'B': 'И',
                'q': 'й', 'Q': 'Й', 'r': 'к', 'R': 'К', 'k': 'л',
                'K': 'Л', 'v': 'м', 'V': 'М', 'y': 'н', 'Y': 'Н',
                'j': 'о', 'J': 'О', 'g': 'п', 'G': 'П', 'h': 'р', 
                'H': 'Р', 'c': 'с', 'C': 'С', 'n': 'т', 'N': 'Т',
                'e': 'у', 'E': 'У', 'a': 'ф', 'A': 'Ф', '[': 'х',
                '{': 'Х', 'w': 'ц', 'W': 'Ц', 'x': 'ч', 'X': 'Ч',
                'i': 'ш', 'I': 'Ш', 'o': 'щ', 'O': 'Щ', ']': 'ъ',
                '}': 'Ъ', 's': 'ы', 'S': 'Ы', 'm': 'ь', 'M': 'Ь',
                '\'': 'э', '"': 'Э', '.': 'ю', '>': 'Ю', 'z': 'я',
                'Z': 'Я', '@': '"', '#': '№', '$': ';', '^': ':',
                '&': '?', '?': ','
            }
        }

        public async execute(args: Command_Args, pars: Command_Pars) {
            this.message = args.message as Message
            if (message_link.test(args.text as string)) {
                this.text = Array.from((await fetchMessageLink(args.text as string)).content)
            } else { this.text = Array.from(args.text as string) }

            const rt = this.text.map(v => this.dictionary.hasOwnProperty(v) ? this.dictionary[v] : v)
            if (rt.empty) {
                const Embed = new EmbedBuilder()
                    .setDescription('🚫 Указанные символы не поддерживаются.')
                return this.message.channel.send({ embeds: [Embed] })
            }

            await this.message.channel.send(rt.join(''))
        }
    }
]

export default command_array