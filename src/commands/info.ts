import { client, fileCommands } from '../bot'
import { Message, MessageEmbed, GuildMember } from 'discord.js'
import { newEmbed, print, LocalTranslate } from '../utils'

const translateData = new LocalTranslate({
    'desktop': 'Компьютер',
    'web': 'Браузер',
    'mobile': 'Телефон',
    'CUSTOM_STATUS': 'Статус: ',
    'PLAYING': 'Играет в ',
    'LISTENING': 'Слушает ',
    'WATCHING': 'Смотрит '
})

const commands: fileCommands[] = [
    {
        aliases: ['user'],
        args: {'member*': 'GuildMember'},
        guildOnly: true,
        run: async (message: Message, members: GuildMember[] = [message.member]) => {
            if (members == null) {
                const Embed = newEmbed()
                    .setDescription('🚫 Пользователь не найден')
                message.channel.send(Embed)
                return
            }

            if (members.length > 1) {
                const Embed = newEmbed()
                    .setTitle('Найдено несколько совпадений...')
                    .setDescription(members.map((e, i) => `\`${i}\`: ` + e.toString()))
                    .setFooter('В течении 20с отправьте номер пользователя.')
                message.channel.send(Embed)

                const collector = message.channel.createMessageCollector(
                    msg => msg.author.id == message.author.id, 
                    { time: 20000 }
                )
    
                collector.on('collect', msg => {
                    if (msg.content.isNumber()) {
                        if (members[msg.content]) {
                            members = [members[msg.content]]
                            sendMessage()
                            collector.stop()
                        } else {
                            const Embed = newEmbed()
                                .setTitle('🚫 Ошибка')
                                .setDescription('Попробуйте ещё раз.')
                            message.channel.send(Embed)
                        }
                    }
                })
            } else { sendMessage() }

            function sendMessage(): void {
                const member = members[0]
                const presence = member.user.presence
                const description = []
                const activities = []

                let platform = Object.keys(presence.clientStatus ?? []).map(e => translateData.translate(e))
                if (member.user.bot) platform = ['Бот']

                description[0] = []
                    .add(`Псевдоним: ${member.nickname}`, member.nickname)
                    .add(`Пользователь: ${member.user.tag}`)
                    .add(`Регистрация: ${new Date(member.user.createdTimestamp).strftime('%d.%m.%y %H:%M:%S')}`)
                    .add(`Подключение: ${new Date(member.joinedTimestamp).strftime('%d.%m.%y %H:%M:%S')}`)
                    .add(`Платформа: ${platform.join(', ')}`, platform.length)
                    .add(`ID: ${member.id}`)

                for (const activity of presence.activities) {
                    if (activity.type == 'CUSTOM_STATUS') {
                        activities.push([translateData.translate(activity.type) + activity.state])
                        continue
                    }

                    const activityForm = []
                        .add(translateData.translate(activity.type) + activity.name)
                        .add(activity.details, activity.details)
                        .add(activity.state, activity.state)
                    activities.push(activityForm.join('\n'))
                }

                const Embed = newEmbed()
                    .setThumbnail(member.user.displayAvatarURL({format: 'png', dynamic: true, size: 4096}))
                    .addField('Общее', '```\n' + description[0].join('\n') + '```')

                if (activities.length) Embed.addField('Активность', activities.map(a => '```\n' + a + '```').join(''))

                message.channel.send(Embed)
            }
        }
    },
    {
        aliases: ['help', '?'],
        run: async (message: Message) => {
            const Embed = newEmbed()
                .setDescription('Информация о командах описана на [сайте](https://github.com/RikZun/Re-Jill/wiki) бота')

            message.channel.send(Embed)
        }
    }
]
export default commands