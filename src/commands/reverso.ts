import { Message, MessageReaction } from 'discord.js'
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
                additional: 'Переводы могут содержать грубую лексику.',
                client_perms: ['EMBED_LINKS'],
                args: [
                    {
                        name: 'text',
                        description: 'Любой текст без цифр.',
                        features: 'join'
                    }
                ],
                pars: [
                    {
                        names: ['--from'],
                        description: 'Язык текста который требуется перевести.\n' +
                        'По умолчанию определяется автоматически.',
                        args: [
                            {
                                name: 'lang',
                                required: true,
                                features: 'join',
                                value: 'auto'
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
                                value: 'rus'
                            }
                        ]
                    },
                    {
                        names: ['--in-context', '-ictx'],
                        description: 'Отобразить варианты слов из контекста.',
                    },
                    {
                        names: ['--context', '-ctx'],
                        description: 'Отображает текст в контексте.',
                    },
                    {
                        names: ['--synonyms', '-syn'],
                        description: 'Отобразить синонимы текста.',
                    },
                    {
                        names: ['--langs'],
                        description: 'Отобразить поддерживаемые языки.',
                    }
                ]
            })
        }

        public async execute(args: Command_Args, pars: Command_Pars) {
            this.start = new Date().getTime()
            this.message = args.message as Message
            this.text = args.text as string
            this.mode = 'translate'

            const langs = {
                ru: ['russian', 'rus', 'ru'],
                en: ['english', 'eng', 'en'],
                de: ['german', 'deutsch', 'ger', 'deu', 'gr', 'de'],
                es: ['spanish', 'espanol', 'spa', 'es'],
                fr: ['french', 'fra', 'fre', 'fr'],
                he: ['hebrew', 'heb', 'he'],
                it: ['italian', 'it'],
                pl: ['polish', 'pol', 'pl'],
                ar: ['arabic', 'ara', 'ar'],
                nl: ['dutch', 'ndl', 'dut', 'nl'],
                zh: ['chinese', 'zho', 'chi', 'zh'],
                pt: ['portuguese', 'por', 'pt'],
                rm: ['romansh', 'roh', 'rum', 'rm'],
                tr: ['turkish', 'tur', 'tr'],
                ja: ['japanese', 'jpn', 'ja', 'jp']
            }

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
                    case '--in-context': {
                        this.mode = 'incontext'
                        break
                    }
                    case '--synonyms': {
                        this.mode = 'synonyms'
                        break
                    }
                    case '--langs': {
                        const Embed = new MessageEmbed()
                            .setDescription(
                                '```autohotkey\n' +
                                Object.entries(langs).map(v => tr(v[0] + '_to') + ': ' + v[1].join(', ')).join('\n') +
                                '```'
                            )
                        return this.message.channel.send(Embed)
                    }
                }
            }

            if (!this.text) {
                const Embed = new MessageEmbed()
                    .setDescription(`🚫 Вы пропустили обязательный аргумент \`text\``)
                return this.message.channel.send(Embed)
            }

            if (this.from == 'auto') await this._detectLang()
            this._normalizeLang(langs)

            if (this.from == this.to && this.mode !== 'synonyms') {
                const Embed = new MessageEmbed()
                    .setDescription(`🚫 Вы попытались перевести с ${tr(this.from + '_from')} на ${tr(this.to + '_to')}`)
                return this.message.channel.send(Embed)
            }

            switch (this.mode) {
                case 'translate': {
                    const langs = {
                        ru: 'rus', en: 'eng', de: 'ger', es: 'spa', fr: 'fra', he: 'heb',
                        it: 'ita', pl: 'pol', ar: 'ara', nl: 'dut', zh: 'chi', pt: 'por',
                        rm: 'rum', tr: 'tur', ja: 'jpn'
                    }

                    if (!langs.hasOwnProperty(this.from) || !langs.hasOwnProperty(this.to)) {
                        const Embed = new MessageEmbed()
                            .setDescription('🚫 Вы указали неверный язык, используйте ./reverso --langs')
                        return this.message.channel.send(Embed)
                    }

                    const data = (await axios({
                        method: 'POST',
                        url: 'https://api.reverso.net/translate/v1/translation',
                        data: {
                            input: this.text,
                            from: langs[this.from],
                            to: langs[this.to],
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
                            source_lang: this.from,
                            target_lang: this.to,
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

                    if (data.list.empty) {
                        const Embed = new MessageEmbed()
                            .setDescription('🚫 Перевод не найден')
                        return this.message.channel.send(Embed)
                    }

                    const shards = data.list.map(v => '```\n' + normalize(v.s_text) + '``````\n' + normalize(v.t_text) + '```')
                    const Embed = new MessageEmbed()
                        .setTitle(`Перевод с ${tr(this.from + '_from')} на ${tr(this.to + '_to')}`)
                        .setFooter(`Выполнено за ${(new Date().getTime() - this.start) / 1000} секунд`)

                    for (let i = 0; i < shards.length; i++) Embed.addField(`Фрагмент ${i + 1}`, shards[i])

                    return this.message.channel.send(Embed)
                }

                case 'incontext': {
                    const data = (await axios({
                        method: 'POST',
                        url: 'https://context.reverso.net/bst-query-service',
                        data: {
                            source_text: this.text,
                            target_text: '',
                            source_lang: this.from,
                            target_lang: this.to,
                            npage: 1,
                            nrows: 10,
                            mode: 0
                        },
                        headers: {
                            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.130 Safari/537.36"
                        }
                    })).data

                    if (data.dictionary_entry_list.empty) {
                        const Embed = new MessageEmbed()
                            .setDescription('🚫 Перевод не найден')
                        return this.message.channel.send(Embed)
                    }
                    
                    const Embed = new MessageEmbed()
                        .setTitle(`Перевод с ${tr(this.from + '_from')} на ${tr(this.to + '_to')}`)
                        .setDescription(data.dictionary_entry_list.map(v => '`' + v.term + '`').join(' '))
                        .setFooter(`Выполнено за ${(new Date().getTime() - this.start) / 1000} секунд`)

                    return this.message.channel.send(Embed)
                }

                case 'synonyms': {
                    let data = ''
                    try {
                        data = (await axios({
                            method: 'GET',
                            url: encodeURI(`https://synonyms.reverso.net/synonym/${this.from}/${this.text}`),
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

        private async _detectLang() {
            const request = await axios({
                method: 'POST',
                url: 'https://api.reverso.net/translate/v1/translation',
                data: {
                    input: this.text,
                    from: 'rus',
                    to: 'eng',
                    format: 'text',
                    options: {
                        languageDetection: true
                    }
                }
            })

            this.from = request.data.languageDetection.detectedLanguage
        }

        private _normalizeLang(langs: {[lang: string]: string[]}) {
            const from = Object.entries(langs).find(v => v[1].includes(this.from))
            const to = Object.entries(langs).find(v => v[1].includes(this.to))
            if (!from || !to) {
                const Embed = new MessageEmbed()
                    .setDescription('🚫 Вы указали неверный язык, используйте ./reverso --lang')
                return this.message.channel.send(Embed)
            }
            this.from = from[0]
            this.to = to[0]
        }
    }
]
export default commandArray