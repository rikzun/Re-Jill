import {client} from '../bot'
import {Message, MessageEmbed} from 'discord.js'
import {get} from '../py'
import {data} from '../events/firebase'

module.exports = {
    'help': async (message: Message, args: string[]) => {
        const msg = new MessageEmbed()
            .setDescription('[Сайт](https://rikzun.github.io/jill.html) с командами')
            .setImage(client.user.avatarURL({format: 'png', size: 512}))
        message.channel.send(msg)
    },
    'bump': async (message: Message, args: string[]) => {
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

        const msg = new MessageEmbed()
            .setDescription(bumptime)
        message.channel.send(msg)
    },
}