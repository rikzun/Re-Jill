import {client} from '../bot'
import {get} from '../py'
import {data, database} from '../events/firebase'
import {Message, WebhookClient, MessageEmbed, TextChannel} from 'discord.js'

module.exports = {
    'settings': async (message: Message, args: string[]) => {

        //admin check
        if (!(message.member.hasPermission('ADMINISTRATOR'))){
            message.channel.send('Требуется право Администратор.')
            return
        }

        switch (args[1]) {
            default:
                const Embed = new MessageEmbed()
                    .setDescription('Описание всех команд на [сайте](https://rikzun.github.io/jill.html)')
                message.channel.send(Embed)
                break;

            case 'multichat':

                //guild in ban
                if (data.guildbans.includes(message.guild.id)) {
                    message.channel.send('Ваш сервер забанен.')
                    break;
                }

                switch (args[2]) {
                    case 'exit':

                        //guild not found
                        if (!get(data.webhooks, message.guild.id, false)) {
                            message.react('❌')
                            message.channel.send('Вас нет в сети мультичата.')
                            break;
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
                        break;
                
                    case 'set':
                        //guild in queue
                        if (get(data.queue, message.guild.id, false)) {
                            const msg = 'Вы уже находитесь в очереди, ' +
                            'если ваш сервер не был принят в течении ' + 
                            'суток значит вы не подходите для добавления ' +
                            'в сеть мультичата, вы сможете подать заявку вновь через неделю.'
                            message.channel.send(msg)
                            break;
                        }

                        //channel not found
                        if (!message.mentions.channels.first()){
                            message.channel.send('Укажите канал.')
                            break;
                        }

                        //multichat alredy connected
                        if (get(data.webhooks, message.guild.id, false)) {
                            if (!message.guild.me.hasPermission('MANAGE_WEBHOOKS')) {
                                const Embed = new MessageEmbed()
                                    .setTitle('Недостаточно прав!')
                                    .setDescription(
                                        'Для использования требуются права:' +
                                        '`Управления вебхуками`'
                                        )
                                message.channel.send(Embed)
                                break;
                            }

                            //del webhook
                            const oldWebhook = new WebhookClient(
                                data.webhooks[message.guild.id].id, data.webhooks[message.guild.id].token);
                            oldWebhook.delete('Создан новый вебхук мультичата.')
        
                            const channel = message.mentions.channels.first()
                            const webhook = channel.createWebhook('МУЛЬТИЧАТ', {
                                avatar: 'https://cdn.discordapp.com/icons/693480389586583553/a8f98c4cbf5b4a991ad5144848568d61.webp'
                            })
        
                            //db update
                            const webhookData = {
                                channelID: channel.id,
                                id: (await webhook).id,
                                token: (await webhook).token
                            }
                            data.webhooks[message.guild.id] = { ...webhookData }
                            database.child(`/webhooks/${message.guild.id}`).update(webhookData)
        
                            message.channel.send('Вы сменили канал мультичата!')
                            break;
                        }

                        //default
                        if (!message.guild.me.hasPermission(['MANAGE_WEBHOOKS', 'MANAGE_GUILD', 'MANAGE_CHANNELS', 'MANAGE_MESSAGES'])) {
                            const Embed = new MessageEmbed()
                                .setTitle('Недостаточно прав!')
                                .setDescription(
                                    'Для использования требуются права:' +
                                    '`Управлять сервером`' +
                                    '`Управлять каналами`' +
                                    '`Управлять вебхуками (webhooks)`' +
                                    '`Управлять сообщениями`'
                                    )
                            message.channel.send(Embed)
                            break;
                        }

                        const channel = message.mentions.channels.first()
                        let webhook
                        try {
                            webhook = channel.createWebhook('МУЛЬТИЧАТ', {
                                avatar: 'https://cdn.discordapp.com/icons/693480389586583553/a8f98c4cbf5b4a991ad5144848568d61.webp'
                            })
                        } catch (error) {
                            message.channel.send('Слишком много вебхуков в данном канале.')
                            message.react('❌')
                            break;
                        }

                        //set slowmode
                        channel.setRateLimitPerUser(5)
        
                        const webhookData = {
                            create: String(Date.now()),
                            channelID: channel.id,
                            id: (await webhook).id,
                            token: (await webhook).token}
                        
                        //db update
                        data.queue[message.guild.id] = webhookData
                        database.child(`/nqueue/${message.guild.id}`).update(webhookData)
                        message.channel.send('Вы добавлены в очередь.')
                        
                        //make invite
                        const inviteChannel = Array.from(message.guild.channels.cache.values())[0]
                        const invite = await inviteChannel.createInvite({maxUses: 1, maxAge: 0, reason: 'Для проверки модератором.'})
                        
                        //support guild
                        const Embed = new MessageEmbed()
                            .addField( 'Invite', invite.url )
                            .setFooter(`Guild ID: ${message.guild.id} | Members ${message.guild.memberCount}`)
                            .setThumbnail(
                                message.guild.iconURL({
                                    format: 'png',
                                    size: 512
                                })
                            )
                        const queueChannel = await client.channels.fetch("693481088076611606") as TextChannel
                        queueChannel.send(Embed)
                        break;
                }
                break;

        case 'bumptimer':
            switch (args[2]) {
                case 'set':
                    
                    //channel not found
                    if (!message.mentions.channels.first()){
                        message.channel.send('Укажите канал.')
                        break;
                    }

                    data.bumptimer[message.guild.id] = {channel: message.mentions.channels.first().id}
                    database.child(`/bumptimer/${message.guild.id}`).update({channel: message.mentions.channels.first().id})
                    
                    message.channel.send('Вы успешно подключили уведомление о bump!')
                    break;
            
                case 'delete':
                    
                    delete data.bumptimer[message.guild.id]
                    database.child(`/bumptimer/${message.guild.id}`).remove()
                    
                    message.channel.send('Вы отключили уведомление о bump!')
                    break;
            }     
        }
    }
}