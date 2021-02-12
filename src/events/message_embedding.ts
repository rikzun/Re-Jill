import { client } from '../bot'
import { Message, TextChannel, MessageOptions } from 'discord.js'
import { MessageEmbed } from '../utils/classes'

client.on('message', async (message: Message) => {
    if (message.author.bot) return
    const message_link_regex = message.content.match(/(!)?https?:\/\/\w+\.com\/channels\/(\d+)\/(\d+)\/(\d+)/)

    if (message_link_regex == null) return
    const [, char, guildID, channelID, messageID] = message_link_regex

    //escape char trigger
    if (char) return

    let channel: TextChannel
    let link_message: Message

    try {
        channel = client.guilds.cache.get(guildID).channels.cache.get(channelID) as TextChannel
        link_message = await channel.messages.fetch(messageID)
    } catch (error) { return }

    const message_options: MessageOptions = {
        content: link_message.cleanContent,
        embed: link_message.embeds[0],
        files: link_message.attachments.array(),
        disableMentions: 'all'
    }

    if (!message_options.content && !message_options.embed && !message_options.files.empty) {
        const Embed = new MessageEmbed()
            .setDescription('🚫 Сообщение пустое.')
        return message.channel.send(Embed)
    }

    const infoEmbed = new MessageEmbed()
        .setAuthor(
            link_message.author.username,
            link_message.author.displayAvatarURL({format: 'png', dynamic: true, size: 4096}))
        .setTimestamp(link_message.createdTimestamp)
        .setDescription(`[ссылка](https://discord.com/channels/${guildID}/${channelID}/${messageID})`)

    try {
        await message.channel.send(message_options)
        await message.channel.send(infoEmbed)
    } catch (error) {}
})