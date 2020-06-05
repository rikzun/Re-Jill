import {client} from '../bot'
import {Message, WebhookClient} from 'discord.js'
import {data} from '../events/firebase'
import {database} from '../events/firebase'
import {print} from '../py'

module.exports = {
    name: 'mchat',
    run: async (message: Message, args: string[]) => {
        if (message.member.hasPermission('MANAGE_GUILD')) {
            if (data.webhooks[message.guild.id]) {
                const webhook = new WebhookClient(
                    data.webhooks[message.guild.id].id, data.webhooks[message.guild.id].token);
                webhook.delete('Создан новый вебхук мультичата.')
            }
            const channel = message.mentions.channels.first()

            const webhook = channel.createWebhook('МУЛЬТИЧАТ', {
                avatar: 'https://cdn.discordapp.com/icons/693480389586583553/a8f98c4cbf5b4a991ad5144848568d61.webp'
            })
            const webhookData = {
                channel: channel.id,
                id: (await webhook).id,
                token: (await webhook).token}
            
            data.webhooks[message.guild.id] = { ...webhookData }
            database.child(`/webhooks/${message.guild.id}`).update(webhookData)
            message.channel.send('Мультичат установлен.')
        }
    }
}