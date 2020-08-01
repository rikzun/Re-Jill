import {client, CommandFile} from '../bot'
import {Message, TextChannel, WebhookClient, MessageEmbed} from 'discord.js'
import {data, database} from '../events/firebase'
import {print, arrayDelValue, get} from '../py'

const commands: CommandFile[] = [
    {
        names: ['mod'],
        args: {category: '', 'args[]': ''},
        run: async (message: Message, category: string, args: string[]) => {
            if (!data.moderators.includes(message.author.id)) return;

            switch (category) {
                case 'message':

                    //id not found
                    if (!data.messages[args[0]]) {
                        message.react('🔎')
                        break;
                    }

                    //del all messages into all servers
                    for (let ch in data.messages[args[0]]) {
                        try {
                            const channel = await client.channels.fetch(ch) as TextChannel
                            const message = await channel.messages.fetch(data.messages[args[0]][ch])
                            
                            await (message.delete())
                        } catch (error) {
                            continue
                        }
                    }
                    delete data.messages[args[0]]
                    database.child(`/nmessages/${args[0]}`).remove()
                    message.react('✅')
                    break;

                case 'user':
                    switch (args[0]) {
                        case 'ban':
                            if (data.bans.includes(args[1])) {
                                message.react('*️⃣')
                                break;
                            }
                            const user = await client.users.fetch(args[1])
                            
                            data.bans.push(args[1])
                            database.child(`/bans`).update({[args[1]]: "0"})
            
                            const reason = args.slice(2).join(' ')
                            const Embed = new MessageEmbed()
                                .setThumbnail(user.avatarURL({format: "png", size: 512}))
                                .addFields(
                                    {name: 'Banned', 
                                    value: `Name: ${user.username}\nID: ${user.id}`},
                                    {name: 'Ban issued', 
                                    value: `Name: ${message.author.username}\nID: ${message.author.id}\nReason: ${reason}`}
                                )
                            const banChannel = await client.channels.fetch('693480909269368933') as TextChannel
                            banChannel.send(Embed)
                            message.react('✅')
                            break;

                        case 'unban':
                            if (!data.bans.includes(args[1])) {
                                message.react('🔎')
                                break;
                            }
                            database.child(`/bans/${args[1]}`).remove()
                            arrayDelValue(data.bans, args[1])
                            message.react('✅')
                            break;
                    
                    }
                    break;

                case 'guild':
                    switch (args[0]) {
                        case 'add':
                            if (!get(data.queue, args[1], false)) {
                                message.react('🔎')
                                break;
                            }
                            delete data.queue[args[1]].create
                            data.webhooks[args[1]] = data.queue[args[1]]
                            database.child(`/webhooks/${args[1]}`).update(data.queue[args[1]])

                            delete data.queue[args[1]]
                            database.child(`/nqueue/${args[1]}`).remove()

                            const mChannel = await client.channels.fetch(data.webhooks[args[1]].channelID) as TextChannel
                            mChannel.send('Вы добавлены в сеть мультичата!\nНе забудьте посмотреть команды `./faq` и `./rules`')
                            message.react('✅')
                            break;
                    
                        case 'ban':
                            if (!get(data.webhooks, args[1], false)) {
                                message.react('🔎')
                                break;
                            }
                            try {
                                const webhook = new WebhookClient(
                                    data.webhooks[args[1]].id, data.webhooks[args[1]].token);
                                await webhook.delete('Вы забанены.')
                            } catch (error) {}

                            const guild = client.guilds.cache.find(g => g.id == args[1])
                            const reason = args.slice(2).join(' ')
                            const Embed = new MessageEmbed()
                                .setThumbnail(guild.iconURL({format: "png", size: 512}))
                                .addFields(
                                    {name: 'Banned', 
                                    value: `Name: ${guild.name}\nID: ${guild.id}`},
                                    {name: 'Ban issued', 
                                    value: `Name: ${message.author.username}\nID: ${message.author.id}\nReason: ${reason}`}
                                )

                            const banChannel = await client.channels.fetch('693480909269368933') as TextChannel
                            banChannel.send(Embed)

                            delete data.webhooks[args[1]]
                            database.child(`/webhooks/${args[1]}`).remove()

                            database.child(`/guildbans`).update({[args[1]]: "0"})
                            data.guildbans.push(args[1])
                            message.react('✅')
                            break;
                    }
                    break;

                case 'invite':
                    if (message.author.id !== client.owner) return;

                    database.child(`/moderators`).update({[args[0]]: "0"})
                    data.moderators.push(args[0])

                    message.react('✅')
                    break;
            }
        }
    },
]
export default commands