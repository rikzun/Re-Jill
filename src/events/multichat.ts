import {Message, WebhookClient, TextChannel} from 'discord.js'
import {data} from '../events/firebase'
import {print, has} from '../py'
import {client} from '../bot'

client.on('message', async (message: Message) => {
    if (message.guild) {
        if (has(data.webhooks, message.guild.id)) {
            if (data.webhooks[message.guild.id].channel == message.channel.id) {
                if (message.author.id == '608154725338185738') message.author.bot = false;
                if (message.author.bot || message.webhookID) return;
                if (data.bans.includes(message.author.id)) return;
                if (message.content.startsWith('./') || message.content.startsWith('!')) return;
                if (message.content.includes('discord.gg')) {
                    data.bans.push(message.author.id)
                    const channel = client.channels.cache.find(c => c.id == '693480909269368933') as TextChannel
                    channel.send(`\`\`\`md\n[${message.author.id}](${message.author.username})\nСсылка приглашение\`\`\``)
                    return}
                
                let attachments: string[] = new Array()
                message.attachments.forEach(v => {
                    attachments.push(v.url)
                })
                for (let ch in data.webhooks) {
                    if (data.webhooks[ch].channel == message.channel.id) continue;
                    const webhook = new WebhookClient(
                        data.webhooks[ch].id, data.webhooks[ch].token);

                    await webhook.send(message.cleanContent, {
                        username: message.author.username + '#' + message.author.discriminator,
                        avatarURL: message.author.avatarURL({format: 'png'}),
                        disableMentions: 'everyone',
                        files: attachments,
                        embeds: message.embeds
                    });
                }
            }
        }
    }
})