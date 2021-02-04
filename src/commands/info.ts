import { RawCommand, MessageEmbed } from '../utils/classes'
import { Message, GuildMember } from 'discord.js'
import { strftime } from '../utils/functions'
import { tr } from '../utils/translate'

const commands: RawCommand[] = [
    {
        aliases: ['user'],
        args: {'gmrt*': 'GuildMember'},
        guildOnly: true,
        execute: async (message: Message, members: GuildMember[]) => {
            if (members.empty) {
                const Embed = new MessageEmbed()
                    .setDescription('🚫 Пользователь не найден')
                return message.channel.send(Embed)
            }

            if (members[0] == undefined) members = [message.member]
            
            if (members.length > 1) {
                const Embed = new MessageEmbed()
                    .setTitle('Найдено несколько совпадений...')
                    .setDescription(members.map((e, i) => `\`${i}\`: ` + e.toString()))
                    .setFooter('В течении 20с отправьте номер пользователя.')
                message.channel.send(Embed)

                const collector = message.channel.createMessageCollector(
                    msg => msg.author.id == message.author.id, 
                    { time: 20000 }
                )
    
                collector.on('collect', msg => {
                    if (msg.content.isNumber() && members[msg.content]) {
                        members = [members[msg.content]]
                        sendMessage()
                        collector.stop()
                    }
                })
            } else { sendMessage() }

            async function sendMessage() {
                const member = members[0]
                const presence = member.user.presence
                const description = []
                const activities = []

                let platform = Object.keys(presence.clientStatus ?? []).map(e => tr(e))
                if (member.user.bot) platform = ['Бот']

                description
                    .add(`Псевдоним: ${member.nickname}`, member.nickname)
                    .add(`Пользователь: ${member.user.tag}`)
                    .add(`Регистрация: ${strftime(member.user.createdTimestamp, '%d.%m.%y %H:%M:%S')}`)
                    .add(`Подключение: ${strftime(member.joinedTimestamp, '%d.%m.%y %H:%M:%S')}`)
                    .add(`Платформа: ${platform.join(', ')}`, platform.length)
                    .add(`ID: ${member.id}`)

                for (const activity of presence.activities) {
                    if (activity.type == 'CUSTOM_STATUS') {
                        activities.push([activity.state])
                        continue
                    }

                    const activityForm = []
                        .add(tr(activity.type) + ' ' + activity.name)
                        .add(activity.details, activity.details)
                        .add(activity.state, activity.state)
                    activities.push(activityForm.join('\n'))
                }

                const Embed = new MessageEmbed()
                    .setThumbnail(member.user.displayAvatarURL({format: 'png', dynamic: true, size: 4096}))
                    .addField('Общее', '```\n' + description.join('\n') + '```')

                if (activities.length) Embed.addField('Активность', activities.map(a => '```\n' + a + '```').join(''))

                message.channel.send(Embed)
            }
        }
    },
    {
        aliases: ['help', '?'],
        execute: async (message: Message) => {
            const Embed = new MessageEmbed()
                .setDescription('Информация о командах описана на [сайте](https://github.com/RikZun/Re-Jill/wiki) бота')

            message.channel.send(Embed)
        }
    }
]
export default commands