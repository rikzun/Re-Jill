import { Message } from 'discord.js'
import { Command, MessageEmbed, Command_Args, Command_Pars } from '../utils/classes'
import axios from 'axios'
import { tr } from '../utils/translate'

const commandArray = [
    class ReversoCommand extends Command {
        message: Message
        text: string
        mode: string
        from: string
        to: string

        start: number

        public constructor() {
            super({
                names: ['reverso', 'rev'],
                description: 'Переводит текст используя сервис reverso.context.',
                additional: 'Переводы могут содержать грубую лексику.\n' +
                'Поддерживаются только Русский, Английский, Немецкий, Испанский, Французский, Иврит, Итальянский и Польский языки.',
                args: [
                    {
                        name: 'text',
                        description: 'Любой текст без цифр.',
                        required: true,
                        features: 'join'
                    }
                ],
                pars: [
                    {
                        names: ['--from'],
                        description: 'Язык текста который требуется перевести.',
                        args: [
                            {
                                name: 'lang',
                                required: true,
                                features: 'join',
                                value: 'auto',
                                values_array: ['auto', 'rus', 'eng', 'ger', 'spa', 'fre', 'heb', 'ita', 'pol']
                            }
                        ]
                    },
                    {
                        names: ['--to'],
                        description: 'Язык на который требуется перевести.',
                        args: [
                            {
                                name: 'lang',
                                required: true,
                                features: 'join',
                                value: 'rus',
                                values_array: ['rus', 'eng', 'ger', 'spa', 'fre', 'heb', 'ita', 'pol']
                            }
                        ]
                    },
                    {
                        names: ['--context', '-ctx'],
                        description: 'Отображает варианты переводов текста из контекста.',
                    },
                    {
                        names: ['--synonyms', '-syn'],
                        description: 'Отобразить синонимы текста.',
                    }
                ]
            })
        }

        public async execute(args: Command_Args, pars: Command_Pars) {
            this.start = new Date().getTime()
            this.message = args.message as Message
            this.text = args.text as string
            this.mode = 'translate'

            for (const [par, par_args] of Object.entries(pars)) {
                switch (par) {
                    case '--from': {
                        this.from = par_args.lang as string
                        break
                    }
                    case '--to': {
                        this.to = par_args.lang as string
                        break
                    }
                    case '--context': {
                        this.mode = 'context'
                        break
                    }
                    case '--synonyms': {
                        this.mode = 'synonyms'
                        break
                    }
                }
            }

            if (this.from == 'auto') {
                const request = await axios({
                    method: 'POST',
                    url: 'https://api.reverso.net/translate/v1/translation',
                    data: {
                        input: this.text,
                        from: 'chi',
                        to: this.to,
                        format: 'text',
                        options: {
                            languageDetection: true
                        }
                    }
                })

                this.from = request.data.languageDetection.detectedLanguage
            }

            if (!this.pars[0].args[0].values_array.includes(this.from)) {
                const Embed = new MessageEmbed()
                    .setDescription(`🚫 Язык ${this.from} не поддерживается`)
                return this.message.channel.send(Embed)
            }
            if (this.from == this.to && this.mode !== 'synonyms') {
                const Embed = new MessageEmbed()
                    .setDescription(`🚫 Вы попытались перевести с ${tr(this.from + '_from')} на ${tr(this.to + '_to')}`)
                return this.message.channel.send(Embed)
            }

            enum ShortedLang {
                rus = 'ru', eng = 'en', ger = 'de', spa = 'es',
                fre = 'fr', heb = 'he', ita = 'it', pol = 'pl'
            }

            switch (this.mode) {
                case 'translate': {
                    const data = (await axios({
                        method: 'POST',
                        url: 'https://api.reverso.net/translate/v1/translation',
                        data: {
                            input: this.text,
                            from: this.from,
                            to: this.to,
                            format: 'text',
                            options: {}
                        }
                    })).data

                    const Embed = new MessageEmbed()
                        .setTitle(`Перевод с ${tr(this.from + '_from')} на ${tr(this.to + '_to')}`)
                        .setDescription('```\n' + this.text.replace('```', '') + '``````' + data.translation[0] + '```')
                        .setFooter(`Выполнено за ${(new Date().getTime() - this.start) / 1000} секунд`)

                    return this.message.channel.send(Embed)
                }

                case 'context': {
                    const data = (await axios({
                        method: 'POST',
                        url: 'https://context.reverso.net/bst-query-service',
                        data: {
                            source_text: this.text,
                            target_text: '',
                            source_lang: ShortedLang[this.from],
                            target_lang: ShortedLang[this.to],
                            npage: 1,
                            nrows: 10,
                            mode: 0
                        },
                        headers: {
                            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.130 Safari/537.36"
                        }
                    })).data

                    function normalize(text: string) {
                        return text.replace(/<em>/g, '[').replace(/<\/em>/g, ']')
                    }

                    let rt = ''
                    if (!data.dictionary_entry_list.empty) rt += data.dictionary_entry_list.map(v => '`' + v.term + '`').join(' ') + '\n\n'
                    if (!data.list.empty) rt += data.list.map(v => '```\n' + normalize(v.s_text) + '``````\n' + normalize(v.t_text) + '```').join('\n')

                    if (!rt) {
                        const Embed = new MessageEmbed()
                            .setDescription('🚫 Перевод не найден')
                        return this.message.channel.send(Embed)
                    }
                    
                    const Embed = new MessageEmbed()
                        .setTitle(`Перевод с ${tr(this.from + '_from')} на ${tr(this.to + '_to')}`)
                        .setDescription(rt)
                        .setFooter(`Выполнено за ${(new Date().getTime() - this.start) / 1000} секунд`)

                    return this.message.channel.send(Embed)
                }

                case 'synonyms': {
                    let data = ''
                    try {
                        data = (await axios({
                            method: 'GET',
                            url: encodeURI(`https://synonyms.reverso.net/synonym/${ShortedLang[this.from]}/${this.text}`),
                            headers: {
                                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.130 Safari/537.36"
                            },
                        
                        })).data
                    } catch (error) {}

                    const arr = Array.from(data.matchAll(/<a href=".+"  class="synonym .*">(.+)<\/a>/g)).map(v => v[1])
                    if (arr.empty) {
                        const Embed = new MessageEmbed()
                            .setDescription('🚫 Синонимы не найдены')
                        return this.message.channel.send(Embed)
                    }

                    const Embed = new MessageEmbed()
                        .setTitle(`Синонимы для ${this.text}`)
                        .setDescription(arr.map(v => '`' + v + '`').join(' '))
                        .setFooter(`Выполнено за ${(new Date().getTime() - this.start) / 1000} секунд`)

                    return this.message.channel.send(Embed)
                }
            }

        }
    }
]
export default commandArray