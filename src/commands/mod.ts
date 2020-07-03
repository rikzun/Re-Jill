import {client} from '../bot'
import {Message, TextChannel, WebhookClient, MessageEmbed} from 'discord.js'
import {data, database} from '../events/firebase'
import {print, arrayDelValue, get} from '../py'

module.exports = {
    'message': async (message: Message, args: string[]) => {
        if (!data.moderators.includes(message.author.id)) return;

        const messageIDS = data.messages[args[1]]

        //id not found
        if (!messageIDS) {
            message.react('🔎')
            return
        }
        
        //del all messages into all servers
        for (let ch in messageIDS) {
            const channel = await client.channels.fetch(ch) as TextChannel
            const message = await channel.messages.fetch(messageIDS[ch]);
            try {
                await (message.delete())
            } catch (error) {
                continue
            }
        }
        
        delete data.messages[args[1]]
        database.child(`/nmessages/${args[1]}`).remove()
        message.react('✅')
    },
    'user': async (message: Message, args: string[]) => {
        if (!data.moderators.includes(message.author.id)) return;
        switch (args[1]) {
            case 'ban':
                const user = await client.users.fetch(args[2])
                
                data.bans.push(args[2])
                database.child(`/bans`).update({[args[2]]: "0"})

                const reason = args.slice(3).join(' ')
                const msg = new MessageEmbed()
                    .setThumbnail(user.avatarURL({format: "png", size: 512}))
                    .addFields(
                        {name: 'Banned', 
                        value: `Name: ${user.username}\nID: ${user.id}`},
                        {name: 'Ban issued', 
                        value: `Name: ${message.author.username}\nID: ${message.author.id}\nReason: ${reason}`}
                    )
                const banChannel = await client.channels.fetch('693480909269368933') as TextChannel
                banChannel.send(msg)
                message.react('✅')
                break;
        
            case 'unban':
                database.child(`/bans/${args[2]}`).remove()
                arrayDelValue(data.bans, args[2])
                message.react('✅')
                break;
        }
    },
    'guild': async (message: Message, args: string[]) => {
        if (!data.moderators.includes(message.author.id)) return;
        switch (args[1]) {
            case 'add':
                if (!get(data.queue, args[2], false)) {
                    message.react('🔎')
                    break;
                }
                    delete data.queue[args[2]].create

                    data.webhooks[args[2]] = data.queue[args[2]]
                    database.child(`/webhooks/${args[2]}`).update(data.queue[args[2]])

                    delete data.queue[args[2]]
                    database.child(`/nqueue/${args[2]}`).remove()

                    const mChannel = await client.channels.fetch(data.webhooks[args[2]].channelID) as TextChannel
                    mChannel.send('Вы добавлены в сеть мультичата!')
                    message.react('✅')
                break;

            case 'ban':
                if (!get(data.webhooks, args[2], false)) {
                    message.react('🔎')
                    break;
                }

                try {
                    const webhook = new WebhookClient(
                        data.webhooks[args[2]].id, data.webhooks[args[2]].token);
                    webhook.delete('Вы забанены.')

                } catch (error) {}

                const guild = client.guilds.cache.find(c => c.id == args[2])
                const reason = args.slice(3).join(' ')
                const msg = new MessageEmbed()
                    .setThumbnail(guild.iconURL({format: "png", size: 512}))
                    .addFields(
                        {name: 'Banned', 
                        value: `Name: ${guild.name}\nID: ${guild.id}`},
                        {name: 'Ban issued', 
                        value: `Name: ${message.author.username}\nID: ${message.author.id}\nReason: ${reason}`}
                    )
                const banChannel = await client.channels.fetch('693480909269368933') as TextChannel
                banChannel.send(msg)

                delete data.webhooks[args[2]]
                database.child(`/webhooks/${args[2]}`).remove()

                database.child(`/guildbans`).update({[args[2]]: "0"})
                data.guildbans.push(args[2])
                message.react('✅')
                break;
        }
    },
    'invite': async (message: Message, args: string[]) => {
        if (message.author.id !== client.owner) return;

        database.child(`/moderators`).update({[args[1]]: "0"})
        data.moderators.push(args[1])
        message.react('✅')
    }
}
