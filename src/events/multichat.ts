import {Message, WebhookClient, TextChannel, MessageEmbed} from 'discord.js'
import {data, database} from '../events/firebase'
import {print, get} from '../py'
import {client} from '../bot'

client.on('message', async (message: Message) => {
    if (message.guild) {
        if ( get(get(data.webhooks, message.guild.id), 'channel') == message.channel.id ) {
            if (message.author.id == client.user.id && message.embeds) return;
            if (message.author.id == client.user.id) message.author.bot = false;
            if (message.author.bot || message.webhookID) return;
            if (data.bans.includes(message.author.id)) return;

            //Несколько мультичатовых команд
            if (message.content.startsWith('./faq')) {
                const msg = new MessageEmbed()
                    .addFields(
                        {
                            name: 'Где я?', 
                            value: 'Вы в мультичате, это канал на вашем сервере, ' + 
                            'в котором отправленные сообщения так же отсылаются на другие сервера.'
                        },
                        {
                            name: 'Что я могу здесь делать?', 
                            value: 'Отправлять сообщения, любые файлы, а так же удалять их, ' + 
                            'редактировать сообщения, увы, нельзя.'
                        },
                        {
                            name: 'Я забанен! Что мне делать?', 
                            value: 'Если вы считаете что должны быть разбанены, ' + 
                            'напишите модераторам в личные сообщения.'
                        }
                    )
                message.channel.send(msg)
            }
            if (message.content.startsWith('./rules')) {
                const msg = new MessageEmbed()
                    .setTitle('Правила мультичата.')
                    .setDescription(
                        '`1.` Запрещена порнография, в любом виде.' +
                        '`2.` Запрещена реклама, в любом виде.' +
                        '`3.` Запрещён намеренный флуд.'
                    )
                message.channel.send(msg)
            }

            if (message.content.startsWith('./') || message.content.startsWith('!')) return;
            if (message.content.includes('discord.gg')) {

                //Добавляем в бан список
                database.child(`/bans`).update({[data.bans.length]: message.author.id})
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
                `Message: ${message.id}\n` +
                `User: ${message.author.id}\n` +
                `Guild: ${message.guild.id}`;

            let messageIds = {}
            messageIds[message.channel.id] = message.id
            
            for (let guild in data.webhooks) {
                if (data.webhooks[guild].channelID == message.channel.id) continue;
                const webhook = new WebhookClient(
                    data.webhooks[guild].id, data.webhooks[guild].token);
                
                //Сообщение с доп инфой на сервере поддержки
                if (guild == '693480389586583553') {
                    message.embeds[0] = new MessageEmbed()
                        .setFooter(messageInfo)
                }
                try {
                    const sendedMessage = await webhook.send(message.cleanContent, {
                        username: message.author.username + '#' + message.author.discriminator,
                        avatarURL: message.author.avatarURL({format: 'png'}),
                        disableMentions: 'everyone',
                        files: attachments,
                        embeds: message.embeds
                    });
                    messageIds[sendedMessage['channel_id']] = sendedMessage.id
                } catch (error) {
                    switch (error['code']) {
                        case '10015':
                            delete data.webhooks[guild]
                            database.child(`/webhooks/${guild}`).remove()
                            break;

                        default:
                            print(error['code'])
                            break;
                    }
                }
                
            }
            data.messages[message.id] = {...messageIds}
            database.child(`/nmessages/${message.id}`).update(messageIds)
        }
    }
})
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