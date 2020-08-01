import {client, CommandFile} from '../bot'
import {Message, MessageEmbed, GuildMember} from 'discord.js'
import {get, print, strftime} from '../py'
import {data} from '../events/firebase'

const commands: CommandFile[] = [
    {
        names: ['help', '?'],
        run: async (message: Message) => {
            const msg = new MessageEmbed()
                .setDescription('[Сайт](https://rikzun.github.io/jill.html) с командами')
                .setImage(client.user.avatarURL({format: 'png', size: 512}))
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
        args: {
            'member*': 'GuildMember'
        },
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
            const joinedAt = strftime('%d.%m.%y %H:%M:%S', member.joinedTimestamp)
            const regAt = strftime('%d.%m.%y %H:%M:%S', member.user.createdTimestamp)
            const Embed = new MessageEmbed()
                .setTitle(member.user.tag)
                .setDescription(
                `**Никнейм:** ${member.nickname ?? 'отсутствует'}\n` +
                `**Подключение:** ${joinedAt}\n` +
                `**Регистрация:**  ${regAt}\n`
                )
                .setThumbnail(avatar)

            message.channel.send(Embed)
        }
    }
]
export default commands