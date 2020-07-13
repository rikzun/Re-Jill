import {client} from '../bot'
import {Message, MessageEmbed, GuildMember} from 'discord.js'
import {get, print} from '../py'
import {data} from '../events/firebase'

module.exports = [
    {
        names: ['help'],
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
            const opt = {
                hour: "numeric",
                minute: "numeric",
                second: "numeric",
                hour12: false
            }
            if (get(data.bumptimer[message.guild.id], 'sdc')) {
                const sdc = new Date(Math.abs(Date.now() - Number(data.bumptimer[message.guild.id].sdc))).toLocaleString("ru-RU", opt);
                bumptime += `До s.up осталось \`${sdc}\`\n` 
            }
            if (get(data.bumptimer[message.guild.id], 'smon')) {
                const smon = new Date(Math.abs(Date.now() - Number(data.bumptimer[message.guild.id].smon))).toLocaleString("ru-RU", opt);
                bumptime += `До !bump осталось \`${smon}\`\n` 
            }
            if (bumptime.length == 0) return;

            const Embed = new MessageEmbed()
                .setDescription(bumptime)
            message.channel.send(Embed)
        }
    },
    {
        names: ['user'],
        args: ['*', 'User'],
        run: async (message: Message, member: GuildMember = message.member) => {

            let avatar: string
            if (!get(member.user, 'avatar', false)) {
                avatar = member.user.defaultAvatarURL
            } else if (member.user.avatar.startsWith('a_')) {
                avatar = member.user.avatarURL({format: 'gif', size: 1024})
            } else {
                avatar = member.user.avatarURL({format: 'png', size: 1024})
            }
            const opt = {
                year: "numeric",
                month: "numeric",
                day: "numeric",
                hour: "numeric",
                minute: "numeric",
                second: "numeric",
                hour12: false
              }
            const joinedAt = new Date(member.joinedTimestamp).toLocaleString("ru-RU", opt)
            const regAt = new Date(member.user.createdTimestamp).toLocaleString("ru-RU", opt)
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