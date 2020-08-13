import {client, CommandFile} from '../bot'
import {Message, MessageEmbed, GuildMember} from 'discord.js'
import {get, print, strftime} from '../py'
import {data} from '../events/firebase'
import * as fs from 'fs'

const localTranslate = {
    'brazil': 'Бразилия',
    'europe': 'Европа',
    'hongkong': 'Гонконг',
    'india': 'Индия',
    'japan': 'Япония',
    'russia': 'Россия',
    'singapore': 'Сингапур',
    'southafrica': 'Южная Африка',
    'sydney': 'Сидней',
    'us-central': 'США Центр',
    'us-east': 'США Восток',
    'us-south': 'США Юг',
    'us-west': 'США Запад',
    'MENTIONS': 'Упоминания',
    'ALL': 'Все сообщения',
    'ANIMATED_ICON': 'Анимированный аватар',
    'BANNER': 'Баннер',
    'COMMERCE': 'Коммерция',
    'DISCOVERABLE': 'Путешествия',
    'INVITE_SPLASH': 'Фон для приглашений',
    'NEWS': 'Канал новостей',
    'PARTNERED': 'Официальное партнёрство',
    'VANITY_URL': 'Собственный URL',
    'VERIFIED': 'Гильдия верифицирована',
    'VIP_REGIONS': 'VIP регион',
    'WELCOME_SCREEN_ENABLED': 'Экран приветствия',
    'COMMUNITY': 'Комьюнити',
    'online': 'онлайн',
    'idle': 'отошёл',
    'dnd': 'не беспокоить',
    'offline': 'оффлайн',
    '???': '???',
    'LISTENING': 'Слушает',
    'PLAYING': 'Играет в',
    'STREAMING': 'Стримит',
    'WATCHING': 'Смотрит'
}

const commands: CommandFile[] = [
    {
        names: ['help', '?'],
        run: async (message: Message) => {
            let filePaths = []
            let fileSize = 0
            for (const obj of await fs.promises.readdir(`./src`)) {
                if (obj.endsWith('.ts')) {
                    filePaths.push(`./src/${obj}`)
                } else {
                    for (const oobj of await fs.promises.readdir(`./src/${obj}`)) {
                        filePaths.push(`./src/${obj}/${oobj}`)
                    }
                }
            }
            for (const file of filePaths) {
                fileSize += (await fs.promises.stat(file)).size
            }

            const msg = new MessageEmbed()
                .setThumbnail(client.user.avatarURL({format: 'png', size: 512}))
                .setDescription(
                    'Все команды отображены на [сайте](https://rikzun.github.io/jill.html)\n' +
                    `Создатель бота <@${client.owner}>\n` + 
                    '```\n' +
                    `Размер файлов: ${(fileSize / 1000).toFixed(1)}КБ\n` +
                    `Количество файлов: ${filePaths.length}\n` +
                    `Версия: ${client.version}` +
                    '```'
                )
                .setFooter('Разработка ведётся с 02.06.2020')
            message.channel.send(msg)
        }
    },
    {
        names: ['bump'],
        run: async (message: Message) => {
            if (!get(data.bumptimer, message.guild.id, false)) {
                message.channel.send('Вы не включили уведомление о bump')
                return
            }
            let bumptime = ''
            if (get(data.bumptimer[message.guild.id], 'sdc')) {
                bumptime += strftime('До `s.up` осталось %H:%M:%S\n', Date.now() - Number(data.bumptimer[message.guild.id].sdc))
            }
            if (get(data.bumptimer[message.guild.id], 'smon')) {
                bumptime += strftime('До `!bump` осталось %H:%M:%S', Date.now() - Number(data.bumptimer[message.guild.id].smon))
            }
            if (bumptime.length == 0) {
                bumptime = 'пусто'
            };

            const Embed = new MessageEmbed()
                .setDescription(bumptime)
            message.channel.send(Embed)
        }
    },
    {
        names: ['user'],
        args: {'member*': 'GuildMember'},
        run: async (message: Message, member: GuildMember) => {
            if (typeof member == 'undefined') {
                member = message.member
            } else if (member == null) {
                message.channel.send('Пользователь не найден.')
                return
            }

            let avatar: string
            if (member.user.avatar == null) {
                avatar = member.user.defaultAvatarURL
            } else if (member.user.avatar.startsWith('a_')) {
                avatar = member.user.avatarURL({format: 'gif', size: 1024})
            } else {
                avatar = member.user.avatarURL({format: 'png', size: 1024})
            }
            
            const joinedAt = strftime('%d.%m.%y %H:%M:%S', member.joinedTimestamp),
                regAt = strftime('%d.%m.%y %H:%M:%S', member.user.createdTimestamp),
                presences = member.guild.presences.cache.get(member.id),
                clientStatus = get(presences, 'clientStatus')

            let customStatus = '',
                activities = ''

            if (presences) {
                presences.activities.forEach(e => {
                    if (e.type == 'CUSTOM_STATUS') {
                        customStatus = e.state
                        return
                    }
                    activities += `${localTranslate[e.type]} ${e.name}\n`
                })
            }

            const Embed = new MessageEmbed()
                .setThumbnail(avatar)
                .addFields(
                    {
                        name: 'Общее',
                        value:
                        '```\n' +
                        `Пользователь: ${member.user.tag}\n` +
                        `Регистрация: ${regAt}\n` +
                        `Подключение: ${joinedAt}\n` +
                        `ID: ${member.id}\n` +
                        '```'
                    }
                )
            if (clientStatus) {
                Embed.addField(
                    'Платформы',
                    '```\n' +
                    `Компьютер: ${localTranslate[clientStatus.desktop ?? '???']}\n` +
                    `Веб: ${localTranslate[clientStatus.web ?? '???']}\n` +
                    `Смартфон: ${localTranslate[clientStatus.mobile ?? '???']}\n` +
                    '```'
                )
            }
            if (customStatus) Embed.addField('Кастомный статус', `\`\`\`\n${customStatus}\`\`\``)
            if (activities) Embed.addField('Активность', `\`\`\`\n${activities}\`\`\``)
                
            message.channel.send(Embed)
        }
    },
    {
        names: ['guild'],
        guild: true,
        run: async (message: Message) => {
            const guild = message.guild
            const guildMemberCount = guild.memberCount - guild.members.cache.filter(m => m.user.bot).size
            let bans: string

            if (guild.me.hasPermission('BAN_MEMBERS')) {
                bans = String((await guild.fetchBans()).size)
            } else {
                bans = '???'
            }

            let guildFeatures = guild.features.slice()
            guildFeatures.forEach((e, i, a) => {
                guildFeatures[i] = localTranslate[e]
            })

            let avatar: string
            if (guild.icon == null) {
                avatar = guild.icon
            } else if (guild.icon.startsWith('a_')) {
                avatar = guild.iconURL({format: 'gif', size: 1024})
            } else {
                avatar = guild.iconURL({format: 'png', size: 1024})
            }

            const Embed = new MessageEmbed()
                .setTitle(`Информация о сервере ${guild.name}`)
                .setThumbnail(avatar)
                .addFields(
                    {
                        name: 'Общая информация', 
                        value: 
                        '```' +
                        `Создатель: ${guild.owner.user.username}\n` +
                        `Создан: ${strftime('%d.%m.%y %H:%M:%S', guild.createdTimestamp)}\n` +
                        `Регион: ${localTranslate[guild.region]}\n` +
                        `Баны: ${bans}\n` +
                        `Эмодзи: ${guild.emojis.cache.size}\n` +
                        `АФК: ${get(guild.afkChannel, 'name', 'отсутствует')}\n` +
                        `Уведомления: ${localTranslate[guild.defaultMessageNotifications]}` +
                        '```',
                        inline: true
                    },
                    {
                        name: 'Объекты', 
                        value:
                        '```' +
                        `Каналов: ${guild.channels.cache.size}\n` +
                        `Текстовых: ${guild.channels.cache.filter(ch => ch.type == 'text').size}\n` +
                        `Голосовых: ${guild.channels.cache.filter(ch => ch.type == 'voice').size}\n` +
                        `Категорий: ${guild.channels.cache.filter(ch => ch.type == 'category').size}\n` +
                        `Ролей: ${guild.roles.cache.size}` +
                        '```',
                        inline: true
                    },
                    {
                        name: 'Участники', 
                        value:
                        '```' +
                        `🔘 Пользователей: ${guildMemberCount}\n` +
                        `⚪ Онлайн: ${guild.presences.cache.filter(m => m.status !== 'offline' && !m.user.bot).size}\n` +
                        `⚫ Оффлайн: ${guildMemberCount - guild.presences.cache.filter(m => m.status !== 'offline' && !m.user.bot).size}\n` +
                        `🟢 В сети: ${guild.presences.cache.filter(m => m.status == 'online' && !m.user.bot).size}\n` +
                        `🟠 Не активен: ${guild.presences.cache.filter(m => m.status == 'idle' && !m.user.bot).size}\n` +
                        `🔴 Не беспокоить: ${guild.presences.cache.filter(m => m.status == 'dnd' && !m.user.bot).size}\n` +
                        `🔵 Боты: ${guild.members.cache.filter(m => m.user.bot).size}` +
                        '```'
                    }
                )
                if (guildFeatures.length > 0) {
                    Embed.addField('Дополнительные возможности', '```' + guildFeatures.join(', ') + '```')}

            message.channel.send(Embed)
        }
    }
]
export default commands