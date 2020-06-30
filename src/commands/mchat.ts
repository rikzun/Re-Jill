import {client} from '../bot'
import {Message, WebhookClient, TextChannel, MessageEmbed} from 'discord.js'
import {data, database} from '../events/firebase'
import {print, get} from '../py'

module.exports = {
    'mchat': async (message: Message, args: string[]) => {
        if (message.member.hasPermission('ADMINISTRATOR')) {

            //exit from mchat
            if (args[1] == 'exit') {
                if (!get(data.webhooks, message.guild.id, false)) {
                    message.react('❌')
                    message.channel.send('Вас нет в сети мультичата.')
                    return
                }

                //try to del webhook
                try {
                    const webhook = new WebhookClient(
                        data.webhooks[message.guild.id].id, data.webhooks[message.guild.id].token);
                    webhook.delete('Вы отключились от сети мультичата.')
                    
                } catch (error) {
                    switch (error['code']) {
                        case '50013':
                            message.react('❌')
                            message.channel.send('Не вышло удалить вебхук.')
                            break;
                    }
                }

                //remove from db
                delete data.webhooks[message.guild.id]
                database.child(`/webhooks/${message.guild.id}`).remove()
                
                message.react('✅')
                message.channel.send('Вы отключились от сети мультичата.')
                return
            }

            //guild in ban
            if (data.guildbans.includes(message.guild.id)) {
                message.channel.send('Ваш сервер забанен.')
                return
            }

            if (!(message.mentions.channels.first())) return;

            //guild in queue
            if (get(data.queue, message.guild.id, false)) {
                const msg = 'Вы уже находитесь в очереди, ' +
                'если ваш сервер не был принят в течении ' + 
                'суток значит вы не подходите для добавления ' +
                'в сеть мультичата, вы сможете подать заявку вновь через неделю.'
                message.channel.send(msg)
                return
            }

            //multichat alredy connected
            if (get(data.webhooks, message.guild.id, false)) {
                if (!message.guild.me.hasPermission('MANAGE_WEBHOOKS')) {
                    const msg = new MessageEmbed()
                        .setTitle('Недостаточно прав!')
                        .setDescription(
                            'Для использования требуются права:' +
                            '`Управления вебхуками`'
                            )
                    message.channel.send(msg)
                    return
                }
                
                const oldWebhook = new WebhookClient(
                    data.webhooks[message.guild.id].id, data.webhooks[message.guild.id].token);
                oldWebhook.delete('Создан новый вебхук мультичата.')

                const channel = message.mentions.channels.first()

                const webhook = channel.createWebhook('МУЛЬТИЧАТ', {
                    avatar: 'https://cdn.discordapp.com/icons/693480389586583553/a8f98c4cbf5b4a991ad5144848568d61.webp'
                })

                const webhookData = {
                    channelID: channel.id,
                    id: (await webhook).id,
                    token: (await webhook).token
                }
                
                data.webhooks[message.guild.id] = { ...webhookData }
                database.child(`/webhooks/${message.guild.id}`).update(webhookData)

                message.channel.send('Вы сменили канал мультичата!')
                return
            }

            //default
            if (!message.guild.me.hasPermission(['MANAGE_WEBHOOKS', 'MANAGE_GUILD', 'MANAGE_CHANNELS', 'MANAGE_MESSAGES'])) {
                const msg = new MessageEmbed()
                    .setTitle('Недостаточно прав!')
                    .setDescription(
                        'Для использования требуются права:' +
                        '`Управлять сервером`' +
                        '`Управлять каналами`' +
                        '`Управлять вебхуками (webhooks)`' +
                        '`Управлять сообщениями`'
                        )
                message.channel.send(msg)
                return
            }
            
            const channel = message.mentions.channels.first()
            const webhook = channel.createWebhook('МУЛЬТИЧАТ', {
                avatar: 'https://cdn.discordapp.com/icons/693480389586583553/a8f98c4cbf5b4a991ad5144848568d61.webp'
            })

            //set slowmode
            channel.setRateLimitPerUser(5)

            const webhookData = {
                create: String(Date.now()),
                channelID: channel.id,
                id: (await webhook).id,
                token: (await webhook).token}
            
            data.queue[message.guild.id] = webhookData
            database.child(`/nqueue/${message.guild.id}`).update(webhookData)
            message.channel.send('Вы добавлены в очередь.')
            
            //make invite
            const inviteChannel = Array.from(message.guild.channels.cache.values())[0]
            const invite = await inviteChannel.createInvite({maxUses: 1, maxAge: 0, reason: 'Для проверки модератором'})

            const msg = new MessageEmbed()
                .addField( 'Invite', invite.url )
                .setFooter(`Guild ID: ${message.guild.id} | Members ${message.guild.memberCount}`)
                .setThumbnail(
                    message.guild.iconURL({
                        format: 'png',
                        size: 512
                    })
                )
            client.multi.queue.send(msg)
            return
        }
    }
}