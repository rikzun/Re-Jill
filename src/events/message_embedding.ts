import { client } from '../bot'
import { Message, TextChannel, APIMessage } from 'discord.js'
import { MessageEmbed } from '../utils/classes'

client.on('message', async (message: Message) => {
    if (message.author.bot) return
    const message_link_regex = message.content.match(/(!)?https?:\/\/\w+\.com\/channels\/(\d+)\/(\d+)\/(\d+)/)

    if (message_link_regex == null) return
    const [, char, guildID, channelID, messageID] = message_link_regex

    //escape char trigger
    if (char) return

    try {
        const channel = client.guilds.cache.get(guildID).channels.cache.get(channelID) as TextChannel
        const link_message = await channel.messages.fetch(messageID)

        const apimessage = new APIMessage(message.channel as TextChannel, {
            content: link_message.cleanContent,
            disableMentions: 'all'
        })
        const embeds = [
            ...link_message.embeds.filter(v => v.type == 'rich'),
            ...link_message.attachments.values()
        ]

        if (!link_message.cleanContent && !embeds.empty) {
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

        await message.channel.send(apimessage, embeds)
        await message.channel.send(infoEmbed)
    } catch (error) {}
})