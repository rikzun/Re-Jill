import { client } from '../bot'
import { Message, TextChannel, MessagePayload } from 'discord.js'
import { MessageEmbed, ClientEvent } from '../utils/classes'

export default class MessageEmbeddingEvent extends ClientEvent {
    constructor() {
        super({
            name: 'message_embedding',
            description: 'Вставляет сообщение по отправленным в чат ссылкам.',
            additional: 'Бот должен находится на том сервере, куда ведёт ссылка на сообщение.\n' +
            'Если перед ссылкой стоит знак восклицания (!) ссылка не будет встроена.'
        })    
    }
}

client.on('messageCreate', async (message: Message) => {
    if (message.author.bot) return
    const message_link_regex = message.content.match(/(!)?https?:\/\/\w+\.com\/channels\/(\d+)\/(\d+)\/(\d+)/)

    if (message_link_regex == null) return
    const [, char, guildID, channelID, messageID] = message_link_regex

    //escape char trigger
    if (char || message.content.startsWith(client.prefix)) return

    try {
        const channel = client.guilds.cache.get(guildID).channels.cache.get(channelID) as TextChannel
        const link_message = await channel.messages.fetch(messageID)

        const content = link_message.content
        const files = Array.from(link_message.attachments.values())
        const embeds = Array.from(link_message.embeds.filter(v => v.type == 'rich'))

        if (!content && files.empty && embeds.empty) {
            const Embed = new MessageEmbed()
                .setDescription('🚫 Сообщение пустое.')
            message.channel.send({ embeds: [Embed] })
            return
        }

        const rtmsg = new MessagePayload(message.channel, {
            content,
            allowedMentions: { parse: [] },
            files,
            embeds
        })

        const infoEmbed = new MessageEmbed()
            .setAuthor({
                name: link_message.author.username,
                iconURL: link_message.author.displayAvatarURL({format: 'png', dynamic: true, size: 4096})
            })
            .setTimestamp(link_message.createdTimestamp)
            .setDescription(`[ссылка](https://discord.com/channels/${guildID}/${channelID}/${messageID})`)

        await message.channel.send(rtmsg)
        await message.channel.send({ embeds: [infoEmbed] })
    } catch (error) {}
})