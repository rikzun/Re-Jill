import {
    Message, MessageEmbed
} from 'discord.js'
import {inspect} from "util"
import {client, CommandFile} from '../bot'
import {hyphenation, print} from '../py'

const commands: CommandFile[] = [
    {
        names: ['eval', 'e'],
        args: {'code*': ''},
        owner: true,
        run: async (message: Message, code, py = require('../py')) => {
            try {
                code = code.match(/```ts\n([\s\S]*?)```/)
                if (!code) throw 'Отсутствует Markdown'

                let evaled = await eval(`(async ()=> {${code[1]}})()`)
                if (typeof evaled !== "string") evaled = inspect(evaled)
                if (evaled.includes('```')) {
                    evaled = evaled.replace(/```/g, '!!!')
                }
                
                //break the text into parts
                let buffer = [],
                    page = 0

                for (let tl = evaled.length; tl > 0; tl = tl - 1900) {
                    let part = evaled.slice(0, 1900)
                    buffer.push(part)
                    evaled = evaled.replace(part, '')
                }
                
                if (buffer.length == 0) buffer.push(evaled)

                function content():MessageEmbed {
                    const Embed = new MessageEmbed()
                        .setDescription(`\`\`\`ts\n${buffer[page]}\`\`\`\`\`\`autohotkey\n::page ${page + 1}/${buffer.length}\`\`\``)

                    return Embed
                }

                const sendedMessage = await message.channel.send(content())
                if (buffer.length == 1) {
                    await sendedMessage.react('🆗')
                } else {
                    await sendedMessage.react('⏮️')
                    await sendedMessage.react('⏪')
                    await sendedMessage.react('🆗')
                    await sendedMessage.react('⏩')
			        await sendedMessage.react('⏭️')
                }

                const filter = (reaction, user) => user.id == message.author.id
                const collector = sendedMessage.createReactionCollector(filter, { time: 120000, dispose: true });
                const pageMove = 
                    async reaction => {
                        switch (reaction.emoji.name) {

                            case '⏮️':
                                if (page == 0) break
                                page = 0
                                sendedMessage.edit(content())
                                break;
    
                            case '⏪':
                                if (page == 0) break
                                page--
                                sendedMessage.edit(content())
                                break;

                            case '🆗':
                                try {
                                    collector.stop()
                                } catch (error) {}
                                
                                await sendedMessage.delete()
                                    .catch()
                                break;

                            case '⏩':
                                if (page + 1 == buffer.length) break
                                page++
                                sendedMessage.edit(content())
                                break;

                            case '⏭️':
                                if (page == buffer.length - 1) break
                                page = buffer.length - 1
                                sendedMessage.edit(content())
                                break;
                        }
                    }

                collector.on('collect', pageMove)
                collector.on('remove', pageMove)
                collector.on('end', async collected => {
                    await sendedMessage.reactions.removeAll()
                        .catch()
                })
            } catch (error) {
                const Embed = new MessageEmbed()
                    .setDescription(`\`\`\`ts\n${error}\`\`\``)

                message.channel.send(Embed)
            }
        }
    },
    {
        names: ['cog'],
        args: {act: '', object: ''},
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
                                commandReq = require(`./${client.commands[cmd].file}`).default[client.commands[cmd].index]
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
                        client.commands[alias].run = require(`./${client.commands[alias].file}`).default[client.commands[alias].index].run
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
                                commandReq = require(`./${client.commands[cmd].file}`).default[client.commands[cmd].index]
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
                        client.commands[alias].run = require(`./${client.commands[alias].file}`).default[client.commands[alias].index].run
                        
                    })
                    message.channel.send('Команда `' + object + '` перезагружена.')
                    break;
            }
        }
    },
]
export default commands