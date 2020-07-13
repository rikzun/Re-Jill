import {
    Message, MessageEmbed
} from 'discord.js'
import {inspect} from "util"
import {client} from '../bot'
import {hyphenation, print} from '../py'

module.exports = [
    {
        names: ['eval', 'e'],
        args: ['*', 'string'],
        owner: true,
        run: async (message: Message, code: string) => {
            if (message.author.id !== client.owner) return;
            try {
                let evaled = await eval(code);
                if (typeof evaled !== "string") evaled = inspect(evaled);
             
                message.channel.send('>>> ```ts\n' + evaled.slice(0, 1900) + '```')
            } catch (error) {
                message.channel.send('>>> ```ts\n' + error + '```')
            }
        }
    },
    {
        names: ['cog'],
        args: ['string', 'string'],
        owner: true,
        run: async (message: Message, act: string, object: string) => {
            switch (act) {
                default:
                    let commands = {
                        on: [],
                        off: []
                    },
                        files = {
                            on: [],
                            off: []
                    }
            
                    for (let item in client.commands) {
                        if (client.commands[item].on) {
                            commands.on.push(item)
                            files.on.push(client.commands[item].file)
                        } else {
                            commands.off.push(item)
                            files.off.push(client.commands[item].file)
                        }
                    }
            
                    const embed = new MessageEmbed()
                        .addFields(
                            {name: 'Loaded cmd',
                            value: '```css\n' + hyphenation(commands.on, 30) + '```'
                            },
                            {name: 'Unloaded cmd', 
                            value: '```css\n' + hyphenation(commands.off, 30) + '```'
                            },
                            {name: 'Loaded files',
                            value: '```css\n' + hyphenation(Array.from(new Set(files.on)), 30) + '```'
                            },
                            {name: 'Unloaded files', 
                            value: '```css\n' + hyphenation(Array.from(new Set(files.off)), 30) + '```'
                            }
                        )
                    message.channel.send(embed)
                    break;

                case 'load':

                    //file handler
                    if (object.includes('.ts')) {

                        if (!client.files.hasOwnProperty(object)) {
                            message.channel.send('Файл `' + object + '` не найден.')
                            break;
                        }
    
                        client.files[object].forEach(cmd => {
                            let commandReq
                            try {
                                commandReq = require(`./${client.commands[cmd].file}`)[client.commands[cmd].index]
                            } catch (error) {
                                commandReq = null
                            }
                            client.commands[cmd].on = true
                            client.commands[cmd].run = commandReq
                        })
    
                        message.channel.send('Файл `' + object + '` загружен.')
                        break;
                    }
            
                    //cmd only
                    if (!client.commands.hasOwnProperty(object)) {
                        message.channel.send('Команда `' + object + '` не найдена.')
                        break;
                    }

                    if (client.commands[object].on) {
                        message.channel.send('Команда `' + object + '` уже загружена.')
                        break;
                    }

                    //load aliases and main cache
                    client.commands[object].names.forEach(alias => {
                        client.commands[alias].on = true
                        client.commands[alias].run = require(`./${client.commands[alias].file}`)[client.commands[alias].index].run
                    })
                    message.channel.send('Команда `' + object + '` загружена.')
                    break;

                case 'unload':

                    //file handler
                    if (object.includes('.ts')) {

                        if (!client.files.hasOwnProperty(object)) {
                            message.channel.send('Файл `' + object + '` не найден.')
                            break;
                        }

                        client.files[object].forEach(cmd => {
                            client.commands[cmd].on = false
                        })

                        delete require.cache[require.resolve(`./${object}`)]
                        message.channel.send('Файл `' + object + '` выгружен.')
                        break;
                    }

                    //cmd only
                    if (!client.commands.hasOwnProperty(object)) {
                        message.channel.send('Команда `' + object + '` не найдена.')
                        break;
                    }

                    if (!client.commands[object].on) {
                        message.channel.send('Команда `' + object + '` уже выгружена.')
                        break;
                    }

                    //del aliases and main cache
                    client.commands[object].names.forEach(alias => {
                        client.commands[alias].on = false
                        client.commands[alias].run = null
                        delete require.cache[require.resolve(`./${client.commands[alias].file}`)]
                    })
                    message.channel.send('Команда `' + object + '` выгружена.')
                    break;

                case 'reload':

                    //file handler
                    if (object.includes('.ts')) {
                        if (!client.files.hasOwnProperty(object)) {
                            message.channel.send('Файл `' + object + '` не найден.')
                            break;
                        }

                        delete require.cache[require.resolve(`./${object}`)]
                        client.files[object].forEach(cmd => {
                            let commandReq
                            try {
                                commandReq = require(`./${client.commands[cmd].file}`)[client.commands[cmd].index]
                            } catch (error) {
                                commandReq = null
                            }
                            client.commands[cmd].run = commandReq
                        })

                        message.channel.send('Файл `' + object + '` перезагружен.')
                        break;
                    }
    
                    //cmd only
                    if (!client.commands.hasOwnProperty(object)) {
                        message.channel.send('Команда `' + object + '` не найдена.')
                        break;
                    }

                    if (!client.commands[object].on) {
                        message.channel.send('Команда `' + object + '` уже выгружена.')
                        break;
                    }

                    //reload aliases and main cache
                    client.commands[object].names.forEach(alias => {
                        delete require.cache[require.resolve(`./${client.commands[alias].file}`)]
                        client.commands[alias].run = require(`./${client.commands[alias].file}`)[client.commands[alias].index].run
                        
                    })
                    message.channel.send('Команда `' + object + '` перезагружена.')
                    break;
            }
        }
    },
]
