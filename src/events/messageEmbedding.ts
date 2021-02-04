import { client } from '../bot'
import { Message, TextChannel, MessageOptions } from 'discord.js'
import { MessageEmbed } from '../utils/classes'

client.on('message', async (message: Message) => {
    if (message.author.bot) return
    const messageLinkRegex = message.content.match(/(!)?https?:\/\/\w+\.com\/channels\/(\d+)\/(\d+)\/(\d+)/)

    if (messageLinkRegex == null) return
    const [, char, guildID, channelID, messageID] = messageLinkRegex

    //escape char trigger
    if (char) return

    let channel: TextChannel
    let linkMessage: Message

    try {
        channel = client.guilds.cache.get(guildID).channels.cache.get(channelID) as TextChannel
        linkMessage = await channel.messages.fetch(messageID)
    } catch (error) { return }

    const messageOptions: MessageOptions = {
        content: linkMessage.cleanContent,
        embed: linkMessage.embeds[0],
        files: linkMessage.attachments.array(),
        disableMentions: 'all'
    }

    if (!messageOptions.content && !messageOptions.embed && !messageOptions.files.empty) {
        const Embed = new MessageEmbed()
            .setDescription('🚫 Сообщение пустое.')
        return message.channel.send(Embed)
    }

    const infoEmbed = new MessageEmbed()
        .setAuthor(
            linkMessage.author.username,
            linkMessage.author.displayAvatarURL({format: 'png', dynamic: true, size: 4096}))
        .setTimestamp(linkMessage.createdTimestamp)
        .setDescription(`[ссылка](https://discord.com/channels/${guildID}/${channelID}/${messageID})`)

    try {
        await message.channel.send(messageOptions)
        await message.channel.send(infoEmbed)
    } catch (error) { console.log(error, messageOptions) }
})