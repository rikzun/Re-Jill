import {client} from '../bot'
import {Message, WebhookClient, TextChannel, MessageEmbed} from 'discord.js'
import {data, database} from '../events/firebase'
import {print, get} from '../py'

module.exports = [
    {
        names: ['faq'],
        run: async (message: Message) => {
            const Embed = new MessageEmbed()
                .addFields(
                    {
                        name: 'Где я?', 
                        value: 'Вы в мультичате, это канал на вашем сервере, ' + 
                        'в котором отправленные сообщения так же отсылаются на другие сервера.'
                    },
                    {
                        name: 'Что я могу здесь делать?', 
                        value: 'Отправлять сообщения, любые файлы, а так же удалять их, ' + 
                        'редактировать сообщения, увы, нельзя.'
                    },
                    {
                        name: 'Я забанен! Что мне делать?', 
                        value: 'Если вы считаете что должны быть разбанены, ' + 
                        'напишите модераторам в личные сообщения.'
                    }
                )
            message.channel.send(Embed)
        }
    },
    {
        names: ['rules'],
        run: async (message: Message) => {
            const Embed = new MessageEmbed()
                .setTitle('Правила мультичата.')
                .setDescription(
                    '`1.` Запрещена порнография, в любом виде.\n' +
                    '`2.` Запрещена реклама, в любом виде.\n' +
                    '`3.` Запрещён намеренный флуд.\n' +
                    '`4.` Запрещёно неадекватное поведение.'
                )
            message.channel.send(Embed)
        }
    },    
]