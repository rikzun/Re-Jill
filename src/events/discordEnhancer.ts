import { client } from '../bot'
import { Message, MessageAttachment, MessageEmbed, TextChannel } from 'discord.js'
import { print, newEmbed } from '../utils'

client.on('message', async (message: Message) => {
    if (message.author.bot) return
    const messageLinkRegex = message.content.matchf(/https?:\/\/(?:canary\.)?discord(?:app)?\.com\/channels\/(\d+)\/(\d+)\/(\d+)/)

    if (!messageLinkRegex) return
    const [guildID, channelID, messageID] = messageLinkRegex

    let channel: TextChannel
    let linkMessage: Message

    try {
        channel = client.guilds.cache.get(guildID).channels.cache.get(channelID) as TextChannel
        linkMessage = await channel.messages.fetch(messageID)
    } catch (error) { return }

    let content = linkMessage.cleanContent.replace(/@/g, '\\@')
    const embeds = []

    if (linkMessage.attachments.size > 0) embeds.push(...linkMessage.attachments.values())
    for (const embed of linkMessage.embeds) {
        switch (embed.type) {
            case 'gifv':
            case 'link':
            case 'video':
                break
            
            case 'rich':
                embeds.push(embed)
                break
            
            case 'image':
                embeds.push(new MessageAttachment(embed.url))
                content = content.replace(embed.url, '')
                break
        }
    }

    if (embeds.length == 0 && content.length == 0) {
        const Embed = newEmbed()
            .setDescription('🚫 Сообщение пустое.')
        message.channel.send(Embed)
        return
    }

    const Embed = newEmbed()
        .setAuthor(
            linkMessage.author.username, 
            linkMessage.author.displayAvatarURL({format: 'png', dynamic: true, size: 4096})
        )
        .setTimestamp(linkMessage.createdTimestamp)
    
    const reactions = linkMessage.reactions.cache
    if (reactions.size > 0) {
        const emojis = []
        for (const Emoji of reactions.values()) {
            if (!Emoji.emoji.id) { emojis.push({rc: Emoji.emoji.name, count: Emoji.count}); continue }
                
            emojis.push({rc: `<:${Emoji.emoji.name}:${Emoji.emoji.id}>`, count: Emoji.count})
        }
        Embed.setDescription(emojis.map(o => `${o.rc} - ${o.count}`))
    }

    try {
        await message.channel.send(content, embeds)
        await message.channel.send(Embed)
    } catch (error) {}
})