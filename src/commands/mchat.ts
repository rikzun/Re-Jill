import {client} from '../bot'
import {Message, WebhookClient, TextChannel, MessageEmbed} from 'discord.js'
import {data, database} from '../events/firebase'
import {print, get} from '../py'

module.exports = {
    name: 'mchat',
    run: async (message: Message, args: string[]) => {
        if (message.member.hasPermission('MANAGE_GUILD')) {

            if (args[1] == 'exit') {
                if ( get(data.webhooks, message.guild.id, false) ) {
                    try {
                        const webhook = new WebhookClient(
                            data.webhooks[message.guild.id].id, data.webhooks[message.guild.id].token);
                        webhook.delete('Вы отключились от сети мультичата.')
                        
                    } catch (error) {
                        switch (error['code']) {
                            case '10015':
                                message.react('❌')
                                message.channel.send('Удаляемый вебхук не найден.')
                                break;
                        
                            case '50013':
                                message.react('❌')
                                message.channel.send('Нет прав для удаления вебхука.')
                                break;
                        }
                    }
                
                    delete data.webhooks[message.guild.id]
                    database.child(`/webhooks/${message.guild.id}`).remove()
                    
                    message.react('✅')
                    message.channel.send('Вы отключились от сети мультичата.')

                } else {
                    message.react('❌')
                    message.channel.send('Вас нет в сети мультичата.')
                }
            }

            //Если сервер в бане
            if (data.guildbans.includes(message.guild.id)) {
                message.channel.send('Ваш сервер забанен.')
                return
            }

            if (!(message.mentions.channels.first())) return;

            //Если сервер в очереди
            if (get(data.queue, message.guild.id, false)) {
                const msg = 'Вы уже находитесь в очереди, ' +
                'если ваш сервер не был принят в течении ' + 
                'суток значит вы не подходите для добавления ' +
                'в сеть мультичата, вы сможете подать заявку вновь через неделю.'
                message.channel.send(msg)
                return
            }

            //Если уже подключён мультичат
            if (get(data.webhooks, message.guild.id, false)) {
                const webhook = new WebhookClient(
                    data.webhooks[message.guild.id].id, data.webhooks[message.guild.id].token);
                webhook.delete('Создан новый вебхук мультичата.')

                const channel = message.mentions.channels.first()

                try {
                    const webhook = channel.createWebhook('МУЛЬТИЧАТ', {
                        avatar: 'https://cdn.discordapp.com/icons/693480389586583553/a8f98c4cbf5b4a991ad5144848568d61.webp'
                    })

                    const webhookData = {
                        channel: channel.id,
                        id: (await webhook).id,
                        token: (await webhook).token}
                    
                    data.webhooks[message.guild.id] = { ...webhookData }
                    database.child(`/webhooks/${message.guild.id}`).update(webhookData)

                    const msg = new MessageEmbed()
                        .setDescription('Вы добавлены в сеть мультичата!')
                    message.channel.send(msg)
                    return

                } catch (error) {
                    switch (error['code']) {
                        case '50013':
                            message.react('❌')
                            
                            const msg = 'Недостаточно прав.\n' +
                            '`Требуется право управления вебхуками`'
                            message.channel.send(msg)
                            break;
                    }
                }
                return
            }

            //Если не если
            try {
                const channel = message.mentions.channels.first()
                const webhook = channel.createWebhook('МУЛЬТИЧАТ', {
                    avatar: 'https://cdn.discordapp.com/icons/693480389586583553/a8f98c4cbf5b4a991ad5144848568d61.webp'
                })

                channel.setRateLimitPerUser(5)

                const webhookData = {
                    create: String(Date.now()),
                    channel: channel.id,
                    id: (await webhook).id,
                    token: (await webhook).token}
                
                data.queue[message.guild.id] = { ...webhookData }
                database.child(`/nqueue/${message.guild.id}`).update(webhookData)
                message.channel.send('Вы добавлены в очередь.')

                const invites = (await message.guild.fetchInvites())
                    .map((e) => e.url)

                const devChannel = client.channels.cache.find(c => c.id == '693481088076611606') as TextChannel
                const msg = new MessageEmbed()
                    .addField( 'Invites', invites )
                    .setFooter(`Guild ID: ${message.guild.id} | Members ${message.guild.memberCount}`)
                    .setThumbnail(
                        message.guild.iconURL({
                            format: 'png',
                            size: 512
                        })
                    )
                devChannel.send(msg)
                return

            } catch (error) {
                switch (error['code']) {
                    case '50013':
                        message.react('❌')

                        const msg = '`Требуется право управления вебхуками`.\n' +
                        '`Требуется право управления сервером`.\n' +
                        '`Требуется право управления каналами`.'
                        message.channel.send(msg)
                        break;
                }
            } 
            
        }
    }
}