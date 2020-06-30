import {client} from '../bot'
import {Message, MessageEmbed} from 'discord.js'
import * as https from 'https'
import {print, get} from '../py'

module.exports = {
    'tt': async (message: Message, args: string[]) => {
        if ( message.author.id == client.owner ) {
            //SUKA BLYAD KAKOGO HUYA NICHEGO NE RABOTAYET?
        } else {
            message.channel.send('сосать + сосать')
        }
    }
}