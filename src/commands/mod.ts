import {client} from '../bot'
import {Message, TextChannel, WebhookClient, MessageEmbed} from 'discord.js'
import {data, database} from '../events/firebase'
import {print, arrayDelValue, get} from '../py'

module.exports = {
    name: 'mod',
    run: async (message: Message, args: string[]) => {
        if (data.moderators.includes(message.author.id)) {
            switch (args[1]) {
                case 'message':
                    const messages = data.messages[args[2]]

                    //Если id сообщения не найден
                    if (!messages) throw {code: '10008'};
                    
                    //Удаление сообщений на всех серверах
                    for (let ch in messages) {
                        const channel = client.channels.cache.find(c => c.id == ch) as TextChannel
                        const message = await channel.messages.fetch(messages[ch]);
                        try {
                            await (message.delete())
                        } catch (error) {
                            switch (error['code']) {
                                case '10008':
                                    message.react('🔎')
                                    break;
                            }
                        }
                        
                    }
                    
                    delete data.messages[args[2]]
                    database.child(`/nmessages/${args[2]}`).remove()
                    message.react('✅')
                    break;
                
                case 'user':
                    switch (args[2]) {
                        case 'ban':
                            const user = client.users.cache.find(u => u.id == args[3])
                            
                            data.bans.push(args[3])
                            database.child(`/bans`).update({[data.bans.length]: args[3]})

                            const reason = args.slice(4).join(' ')
                            const banChannel = client.users.cache.find(u => u.id == '693480909269368933')
                            const msg = new MessageEmbed()
                                .setThumbnail(user.avatarURL({format: "png", size: 512}))
                                .addFields(
                                    {name: 'Banned', 
                                    value: `Name: ${user.username}\nID: ${user.id}`},
                                    {name: 'Ban issued', 
                                    value: `Name: ${message.author.username}\nID: ${message.author.id}\nReason: ${reason}`}
                                )
                            banChannel.send(msg)
                            message.react('✅')
                            break;
                    
                        case 'unban':
                            const index = data.bans.indexOf(args[3])
                            arrayDelValue(data.bans, args[3])
                            database.child(`/bans/${index}`).remove()
                            message.react('✅')
                            break;
                    }
                    break;

                case 'invite':
                    if (message.author.id == client.owner) {
                        database.child(`/moderators`).update({[data.moderators.length]: args[2]})
                        data.moderators.push(args[2])
                        message.react('✅')
                    }
                    break;

                case 'guild':
                    switch (args[2]) {
                        case 'add':
                            if ( get(data.queue, args[3], false) ) {
                                delete data.queue[args[3]].create

                                data.webhooks[args[3]] = { ...data.queue[args[3]] }
                                database.child(`/webhooks/${args[3]}`).update(data.queue[args[3]])

                                delete data.queue[args[3]]
                                database.child(`/nqueue/${args[3]}`).remove()

                                const whChannel = client.channels.cache.find(c => c.id == data.webhooks[args[3]].channel) as TextChannel
                                const msg = new MessageEmbed()
                                    .setDescription('Вы добавлены в сеть мультичата!')

                                whChannel.send(msg)
                                message.react('✅')
                            } else {
                                message.react('🔎')
                            }
                            break;

                        case 'ban':
                            if ( get(data.webhooks, args[3], false) ) {
                                try {
                                    const webhook = new WebhookClient(
                                        data.webhooks[args[3]].id, data.webhooks[args[3]].token);
                                    webhook.delete('Вы забанены.')

                                } catch (error) {}

                                const guild = client.guilds.cache.find(c => c.id == args[3])
                                const reason = args.slice(4).join(' ')
                                const banChannel = client.users.cache.find(u => u.id == '693480909269368933')
                                const msg = new MessageEmbed()
                                    .setThumbnail(guild.iconURL({format: "png", size: 512}))
                                    .addFields(
                                        {name: 'Banned', 
                                        value: `Name: ${guild.name}\nID: ${guild.id}`},
                                        {name: 'Ban issued', 
                                        value: `Name: ${message.author.username}\nID: ${message.author.id}\nReason: ${reason}`}
                                    )
                                banChannel.send(msg)

                                delete data.webhooks[args[3]]
                                database.child(`/webhooks/${args[3]}`).remove()

                                database.child(`/guildbans`).update({[data.guildbans.length]: args[3]})
                                data.guildbans.push(args[3])
                                message.react('✅')
                            } else {
                                message.react('🔎')
                            }
                            break;
                    }
                    break;
            }
        }
    }
}