import {client} from '../bot'
import {Message, MessageEmbed, MessageReaction} from 'discord.js'
import {print} from '../py'

module.exports = {
    name: 'admin',
    run: async (message: Message, args: string[]) => {
        let mainEmbed = new MessageEmbed()
            .addField(
                'Admin Panel',
                ':regional_indicator_m: ODULE')

        let commandMessage = await message.channel.send(mainEmbed)
        await commandMessage.react('🇲')

        const filter = ((reaction, user) => {
            return reaction.emoji.name && user.id === message.author.id})

        const collector = commandMessage.createReactionCollector(filter, { time: 50000 })
        let lastEmoji: MessageReaction
        collector.on('collect', r => 
        {if (r.emoji.name == '🇲') {
            print(1)
            commandMessage.reactions.removeAll();

            const embed = new MessageEmbed()
                .addField(
                    'Module',
                    `:regional_indicator_l: OAD
                    :regional_indicator_u: NLOAD
                    :regional_indicator_r: ELOAD`)
            commandMessage.edit(embed);

            (async () => {
                await commandMessage.react('🇱')
                await commandMessage.react('🇺')
                await commandMessage.react('🇷')
                await commandMessage.react('⏪')
            })()
        }
        if (r.emoji.name == '🇱') {
            print('kek')
        }
        if (r.emoji.name == '⏪') {
            print(1)
            client.emit(
                "messageReactionAdd",
                lastEmoji,
                message.author)
        }
    
    
    
        lastEmoji = r})

        // .then(collected => {
        //     const reaction = collected.first();
    
        //     if (reaction.emoji.name === '🇲') {
        //         commandMessage.reactions.removeAll()
        //         const embed = new MessageEmbed()
        //             .addField(
        //                 'Module',
        //                 `:regional_indicator_l: OAD
        //                 :regional_indicator_u: NLOAD
        //                 :regional_indicator_r: ELOAD`)
        //         commandMessage.edit(embed);
        //         commandMessage.react('🇱')
        //         // (async () => {
        //         //     await commandMessage.react('🇱')
        //         //     await commandMessage.react('🇺')
        //         //     await commandMessage.react('🇷')
        //         // })()
        //     }
        //     if (reaction.emoji.name === '🇱') {
        //         print('kek')}
        // })
        // .catch (() => {
        //     commandMessage.reactions.removeAll()
        // })
    }
}