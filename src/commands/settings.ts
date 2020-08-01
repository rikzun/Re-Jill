import {client, CommandFile} from '../bot'
import {get, print, botHasPermissions} from '../py'
import {data, database} from '../events/firebase'
import {Message, WebhookClient, MessageEmbed, TextChannel, GuildChannel} from 'discord.js'

const commands: CommandFile[] = [
    {
        names: ['s'],
        perms: ['ADMINISTRATOR'],
        guild: true,
        args: {option: '', act: '', 'object?': 'TextChannel'},
        run: async (message: Message, option: string, act: string, object: TextChannel | string) => {
            switch (option) {
                case 'private':

                    switch (act) {
                        case 'create':
                            const botPermsCreate = botHasPermissions(message, ['MOVE_MEMBERS', 'MANAGE_CHANNELS'])
                            if (botPermsCreate !== true) {
                                message.channel.send(botPermsCreate)
                                break;
                            }

                            const channel = await message.guild.channels.create('Создать приват', {type: 'voice', parent: (message.channel as GuildChannel).parent})
                            
                            data.privates[message.guild.id] = {original: channel.id, createdChannels: []}
                            database.child(`/privates/${message.guild.id}`).update({original: channel.id})
    
                            message.channel.send('Новые каналы будут созданы в той же категории что и канал, вы можете переместить его куда угодно.')
                            break;
    
                        case 'delete':
                            if (!get(data.privates, message.guild.id, false)) {
                                message.channel.send('У вас не включены приваты.')
                                return
                            }

                            const botPermsDelete = botHasPermissions(message, ['MANAGE_CHANNELS'])
                            if (botPermsDelete !== true) {
                                message.channel.send(botPermsDelete)
                                break;
                            }
    
                            //удаление мейн канала
                            try {
                                const original = await client.channels.fetch(data.privates[message.guild.id].original) as GuildChannel
                                await original.delete()
                            } catch (error) {}
    
                            //удаляем созданные каналы
                            if (get(data.privates[message.guild.id], 'createdChannels', false)) {
                                for (let ch in data.privates[message.guild.id].createdChannels) {
                                    try {
                                        const channel = await client.channels.fetch(ch) as GuildChannel
                                        await channel.delete()
                                    } catch (error) {
                                        continue
                                    }
                                }
                            }
    
                            //отчистка инфы
                            delete data.privates[message.guild.id]
                            database.child(`/privates/${message.guild.id}`).remove()
    
                            message.channel.send('Все приваты были удалены.')
                            break;
                    }
                    break;

                case 'multichat':

                    //guild in ban
                    if (data.guildbans.includes(message.guild.id)) {
                        message.channel.send('Ваш сервер забанен.')
                        break;
                    }

                    switch (act) {

                        default:
                            message.channel.send('Укажите действие.')
                            break;

                        case 'delete':

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
                                await webhook.delete('Вы отключились от сети мультичата.')
                                
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
                            if (typeof object !== 'object'){
                                message.channel.send('Укажите канал.')
                                break;
                            }

                            //multichat alredy connected
                            if (get(data.webhooks, message.guild.id, false)) {
                                const botPermsConnected = botHasPermissions(message, ['MANAGE_WEBHOOKS'])
                                if (botPermsConnected !== true) {
                                    message.channel.send(botPermsConnected)
                                    break;
                                }

                                //try del webhook
                                try {
                                    const oldWebhook = new WebhookClient(
                                        data.webhooks[message.guild.id].id, data.webhooks[message.guild.id].token);
                                    await oldWebhook.delete('Создан новый вебхук мультичата.')
                                } catch (error) {}
        
                                const webhook = object.createWebhook('МУЛЬТИЧАТ', {
                                    avatar: 'https://cdn.discordapp.com/icons/693480389586583553/a8f98c4cbf5b4a991ad5144848568d61.webp'
                                })
        
                                //db update
                                const webhookData = {
                                    channelID: object.id,
                                    id: (await webhook).id,
                                    token: (await webhook).token
                                }
                                data.webhooks[message.guild.id] = { ...webhookData }
                                database.child(`/webhooks/${message.guild.id}`).update(webhookData)
                                
                                message.react('✅')
                                message.channel.send('Вы сменили канал мультичата!')
                                break;
                            }

                            //default
                            const botPermsDefault = botHasPermissions(message, ['MANAGE_WEBHOOKS', 'MANAGE_GUILD', 'MANAGE_CHANNELS', 'MANAGE_MESSAGES'])
                                if (botPermsDefault !== true) {
                                    message.channel.send(botPermsDefault)
                                    break;
                                }

                            let webhook
                            try {
                                webhook = await object.createWebhook('МУЛЬТИЧАТ', {
                                    avatar: 'https://cdn.discordapp.com/icons/693480389586583553/a8f98c4cbf5b4a991ad5144848568d61.webp'
                                })
                            } catch (error) {
                                message.channel.send('Слишком много вебхуков в данном канале.')
                                message.react('❌')
                                break;
                            }

                            //set slowmode and update everyone perm
                            object.setRateLimitPerUser(5)
                            object.updateOverwrite(message.guild.roles.everyone.id, {'USE_EXTERNAL_EMOJIS': true})
        
                            const webhookData = {
                                create: String(Date.now()),
                                channelID: object.id,
                                id: (await webhook).id,
                                token: (await webhook).token}
                            
                            //db update
                            data.queue[message.guild.id] = webhookData
                            database.child(`/nqueue/${message.guild.id}`).update(webhookData)
                            message.react('✅')
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

                    switch (act) {

                        case 'set':
                            
                            //channel not found
                            if (typeof object !== 'object'){
                                message.channel.send('Укажите канал.')
                                break;
                            }
        
                            data.bumptimer[message.guild.id] = {channel: object.id}
                            database.child(`/bumptimer/${message.guild.id}`).update({channel: object.id})
                            
                            message.channel.send('Вы успешно подключили уведомление о bump!')
                            break;
                    
                        case 'delete':
                            
                            delete data.bumptimer[message.guild.id]
                            database.child(`/bumptimer/${message.guild.id}`).remove()
                            
                            message.channel.send('Вы отключили уведомление о bump!')
                            break;
                    }   
                    break;
            }
        }
    }
]
export default commands