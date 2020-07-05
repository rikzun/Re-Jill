import {Message, WebhookClient, TextChannel, MessageEmbed} from 'discord.js'
import {data, database} from '../events/firebase'
import {print, get} from '../py'
import {client} from '../bot'

client.on('message', async (message: Message) => {
    if (!message.guild) return;
    if (get(data.webhooks, message.guild.id).channelID !== message.channel.id) return;
    if (message.author.bot || message.webhookID) return;
    if (data.bans.includes(message.author.id)) {
        try {
            message.delete()
        } catch (error) {}
    }
    if (message.content.startsWith('./') || message.content.startsWith('!')) return;
    if (message.content.includes('discord.gg')) {

        //Добавляем в бан список
        database.child(`/bans`).update({[message.author.id]: '0'})
        data.bans.push(message.author.id)

        //Сообщение о бане на сервер поддержки
        const channel = await client.channels.fetch('693480909269368933') as TextChannel
        const msg = new MessageEmbed()
            .setThumbnail(message.author.avatarURL({format: "png", size: 512}))
            .addFields(
                {name: 'Banned', 
                value: `Name: ${message.author.username}\nID: ${message.author.id}`},
                {name: 'Ban issued', 
                value: `Name: ${client.user.username}\nID: ${client.user.id}\nReason: discord.gg trigger`}
            )
        channel.send(msg)

        //Уведомление о бане
        const banMessage = new MessageEmbed()
            .setTitle('Вы были забанены')
            .setDescription('Бан выдан модератором Jill.\nПричина: Ссылка-приглашение')
        message.channel.send(banMessage)
        return
    }
    
    //Подкручиваем все вложения
    let attachments: string[] = new Array()
    message.attachments.forEach(v => {
        attachments.push(v.url)
    })
    const messageInfo = 
        `\n>>> \`\`\`Message: ${message.id}\n` +
        `User: ${message.author.id}\n` +
        `Guild: ${message.guild.id}\`\`\``;

    let messageIds = {}
    messageIds[message.channel.id] = message.id

    const originalContent = message.content
    
    for (let guild in data.webhooks) {
        try {
            if (data.webhooks[guild].channelID == message.channel.id) continue;
            const webhook = new WebhookClient(
                data.webhooks[guild].id, data.webhooks[guild].token);

            let webhookName = message.author.username + '#' + message.author.discriminator
            message.content = originalContent

            //Выделение модерации
            if (data.moderators.includes(message.author.id)) {
                webhookName += '[M]'
            }

            //Сообщение с доп инфой на сервере поддержки
            if (guild == '693480389586583553') {
                message.content += messageInfo
            }
        
            const sendedMessage = await webhook.send(message.cleanContent, {
                username: webhookName,
                avatarURL: message.author.avatarURL({format: 'png'}) ?? message.author.defaultAvatarURL,
                disableMentions: 'everyone',
                files: attachments
            });
            messageIds[sendedMessage['channel_id']] = sendedMessage.id
        } catch (error) {
            switch (error['code']) {
                case '10015':
                    delete data.webhooks[guild]
                    database.child(`/webhooks/${guild}`).remove()
                    break;
            }
        }
        
    }
    data.messages[message.id] = {...messageIds}
    database.child(`/nmessages/${message.id}`).update(messageIds)

    }
)

client.on('messageDelete', async (message: Message) => {
    if ( get(data.messages, message.id, false) ) {
        if (data.bans.includes(message.author.id)) return;
        if (message.content.includes('discord.gg')) {
            data.bans.push(message.author.id)
            database.child(`/bans`).update({[data.bans.length]: message.author.id})
            const channel = await client.channels.fetch('693480909269368933') as TextChannel
    
            const msg = new MessageEmbed()
                .setThumbnail(message.author.avatarURL({format: "png", size: 512}))
                .addFields(
                    {name: 'Banned', 
                    value: `Name: ${message.author.username}\nID: ${message.author.id}`},
                    {name: 'Ban issued', 
                    value: `Name: ${client.user.username}\nID: ${client.user.id}\nReason: discord.gg trigger`}
                )
            channel.send(msg)
            return
        }

        //Удаление сообщений на всех серверах
        for (let ch in data.messages[message.id]) {
            if (data.messages[message.id][ch] == message.id) continue;

            const channel = await client.channels.fetch(ch) as TextChannel
            const msg = await channel.messages.fetch(data.messages[message.id][ch])
            try {
                msg.delete()
            } catch (error) {
                continue
            }
        }
    }
})