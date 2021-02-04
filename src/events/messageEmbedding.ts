import { client } from '../bot'
import { Message, MessageAttachment, TextChannel } from 'discord.js'
import { MessageEmbed } from '../utils/classes'

client.on('message', async (message: Message) => {
    if (message.author.bot) return
    const messageLinkRegex = message.content.match(/(!)?https?:\/\/\w+\.com\/channels\/(\d+)\/(\d+)\/(\d+)/)

    if (messageLinkRegex == null) return
    const [char, guildID, channelID, messageID] = messageLinkRegex

    //escape char trigger
    if (char) return

    let channel: TextChannel
    let linkMessage: Message

    try {
        channel = client.guilds.cache.get(guildID).channels.cache.get(channelID) as TextChannel
        linkMessage = await channel.messages.fetch(messageID)
    } catch (error) { return }

    let content = linkMessage.cleanContent
        .replace(/@everyone/g, '`@everyone`')
        .replace(/@here/g, '`@here`')
    const embeds = []

    if (content.length > 2048) content = content.substring(0, 2048)

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
        const Embed = new MessageEmbed()
            .setDescription('🚫 Сообщение пустое.')
        return message.channel.send(Embed)
    }

    const infoEmbed = new MessageEmbed()
        .setAuthor(
            linkMessage.author.username, 
            linkMessage.author.displayAvatarURL({format: 'png', dynamic: true, size: 4096})
        )
        .setTimestamp(linkMessage.createdTimestamp)

    try {
        await message.channel.send(content, embeds)
        await message.channel.send(infoEmbed)
    } catch (error) {}
})