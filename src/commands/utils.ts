import { Collection, Message, DMChannel } from 'discord.js'
import { ClientCommand, MessageEmbed, Client_Args, Client_Pars } from '../utils/classes'
import { emoji_regex, unicode_emoji_regex } from '../utils/regex'
import { emojis } from '../events/emoji_data'

const command_array = [
    class EmojiCommand extends ClientCommand {
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
                        description: 'Строка из эмодзи.',
                        required: true,
                        features: 'array'
                    }
                ],
                pars: [
                    {
                        names: ['--help', '-h', '-?'],
                        description: 'Отображение сведений об использовании.',
                        args: []
                    },
                    {
                        names: ['-s'],
                        description: 'Использовать пробелы как разделитель эмодзи.',
                        args: []
                    }
                ]
            })
        }

        public async execute(args: Client_Args, pars: Client_Pars): Promise<unknown> {
            const message = args.message as Message
            let separator = ''
            for (const [par, par_args] of Object.entries(pars)) {
                switch (par) {
                    case '--help': return this.send_help(message)
                    case '-s': separator = ' '
                }
            }
            
            const emoji_array = this._contentFix(args.emoji_array as string[])
            const matches = this._find_emojis(emoji_array)

            //some emojis check
            if (!matches.filter(v => v.length > 1).empty) {
                const options = []
                const positions = []

                for (let i = 0; i < matches.length; i++) positions.push(0)

                while (true) {
                    options.push(positions.map((pos, index) => matches[index][pos]).join(separator))
                
                    let found_increment = false
                    for (let i = 0; i < positions.length; i++) {
                        positions[i]++

                        if (positions[i] < matches[i].length) {
                            found_increment = true
                            break
                        } else { 
                            positions[i] = 0 
                        }
                    }
                
                    if (!found_increment) break
                }
                return this._choose(message, options)
            }

            return message.channel.send(matches.join(separator))
        }

        private _contentFix(emoji_array: string[]): string[] {
            const rt = []
            emoji_array.forEach(v => rt.push(...v.ssplit('\n')))
            return rt
        }

        private _find_emojis(emoji_array: string[]): unknown[][] {
            const rt = []

            for (const char of emoji_array.map(v => v.toLocaleLowerCase())) {
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

        private _choose(message: Message, options: string[]): void {
            const Embed = new MessageEmbed()
                .setTitle('Найдено несколько совпадений...')
                .setDescription(options.map((v, i) => `\`${i + 1}\`\n${v}\n`))
                .setFooter('В течении 20с отправьте номер варианта.')

            const sent_message = message.channel.send(Embed)
            const collector = message.channel.createMessageCollector(
                msg => msg.author.id == message.author.id, 
                { time: 20000 }
            )
            collector.on('collect', async (msg: Message) => {
                if (!msg.content.isNumber && !options[Number(msg.content) - 1]) return

                collector.stop()
                message.channel.send(options[Number(msg.content) - 1])

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
]

export default command_array