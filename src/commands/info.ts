import { client, fileCommands } from '../bot'
import { Message, MessageEmbed, GuildMember } from 'discord.js'
import { newEmbed, print } from '../utils'

const translate = {
    'desktop': 'ПК',
    'web': 'Браузер',
    'mobile': 'Телефон'
}

const commands: fileCommands[] = [
    {
        aliases: ['user'],
        args: {'member*': 'GuildMember'},
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
                                .setDescription('🚫 Ошибка')
                            message.channel.send(Embed)
                        }
                    }
                })
            } else { sendMessage() }

            function sendMessage(): void {
                const member = members[0]
                const presence = member.user.presence
                // print(presence)
                const platform = Object.keys(presence.clientStatus ?? []).map(e => translate[e])
                const description = []

                description[0] = []
                    .add(`Псевдоним: ${member.nickname}`, member.nickname)
                    .add(`Пользователь: ${member.user.tag}`)
                    .add(`Регистрация: ${new Date(member.user.createdTimestamp).strftime('%d.%m.%y %H:%M:%S')}`)
                    .add(`Подключение: ${new Date(member.joinedTimestamp).strftime('%d.%m.%y %H:%M:%S')}`)
                    .add(`Платформа: ${platform.join(', ')}`, platform.length)
                    .add(`ID: ${member.id}`)
                
                const Embed = newEmbed()
                    .setThumbnail(member.user.displayAvatarURL({format: 'png', dynamic: true, size: 4096}))
                    .addField('Общее', '```\n' + description[0].join('\n') + '```')
                message.channel.send(Embed)
            }

        
            // if (presences) {
            //     presences.activities.forEach(e => {
            //         if (e.type == 'CUSTOM_STATUS') {
            //             customStatus = e.state
            //             return
            //         }
            //         activities += `${localTranslate[e.type]} ${e.name}\n`
            //     })
            // }

            // const Embed = new MessageEmbed()
            //     .setThumbnail(member.user.avatarURL({format: 'png', dynamic: true, size: 4096}))
            //     .addFields(
            //         {
            //             name: 'Общее',
            //             value:
            //             '```\n' +
            //             `Пользователь: ${member.user.tag}\n` +
            //             `Регистрация: ${regAt}\n` +
            //             `Подключение: ${joinedAt}\n` +
            //             `ID: ${member.id}\n` +
            //             '```'
            //         }
            //     )
            // if (clientStatus) {
            //     Embed.addField(
            //         'Платформы',
            //         '```\n' +
            //         `Компьютер: ${localTranslate[clientStatus.desktop ?? '???']}\n` +
            //         `Веб: ${localTranslate[clientStatus.web ?? '???']}\n` +
            //         `Смартфон: ${localTranslate[clientStatus.mobile ?? '???']}\n` +
            //         '```'
            //     )
            // }
            // if (customStatus) Embed.addField('Кастомный статус', `\`\`\`\n${customStatus}\`\`\``)
            // if (activities) Embed.addField('Активность', `\`\`\`\n${activities}\`\`\``)
                
            // message.channel.send(Embed)
        }
    }
]
export default commands