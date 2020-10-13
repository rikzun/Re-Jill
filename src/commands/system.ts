import { Message, MessageEmbed } from 'discord.js'
import { inspect } from "util"
import { fileCommands } from '../bot'
import { print, newEmbed } from '../utils'
import { transpile } from 'typescript'

const commands: fileCommands[] = [
    {
        aliases: ['eval', 'e'],
        args: {'code*': 'string'},
        ownerOnly: true,
        run: async (message: Message, input: string) => {
            try {
                const code = input.match(/```ts\n([\s\S]*?)```/)[1]
                if (!code) throw 'Отсутствует Markdown'

                const imports = 'discord = require("discord.js"), utils = require("../utils")'
                let evaled = inspect(await eval('(async(' + imports + ')=>{' + transpile(code) + '})()'))
                if (!code.includes('return')) return
                if (evaled.includes('```')) evaled = evaled.replace(/```/g, '~~~')

                let page = 0
                let buffer = []

                if (evaled.length > 1900) {
                    for(let tl = evaled.length; tl > 0; tl = tl - 1900) {
                        const index = Math.max(...evaled.indexOfAll('\n').filter(index => index < 1900))
                        const part = evaled.slice(0, index)
                        evaled = evaled.replace(part, '')
                        buffer.push(part)
                    }
                } else { buffer.push(evaled) }

                
                function content() {
                    const output = '```ts\n' + buffer[page] + '```' + '```autohotkey\n' + `::page ${page + 1}/${buffer.length}` + '```'
                    return newEmbed().setDescription(output)
                }
                
                const sentMessage = await message.channel.send(content())

                if (buffer.length > 1) {
                    await sentMessage.react('⏮️')
                    await sentMessage.react('⏪')
                    await sentMessage.react('🆗')
                    await sentMessage.react('⏩')
                    await sentMessage.react('⏭️')
                } else { await sentMessage.react('🆗') }
                
                const collector = sentMessage.createReactionCollector(
                    (reaction, user) => user.id == message.author.id, 
                    { time: 120000, dispose: true }
                )

                const pageMove = 
                    async reaction => {
                        switch (reaction.emoji.name) {

                            case '⏮️':
                                if (page == 0) break
                                page = 0
                                await sentMessage.edit(content())
                                break;
    
                            case '⏪':
                                if (page == 0) break
                                page--
                                await sentMessage.edit(content())
                                break;

                            case '🆗':
                                collector.stop()
                                await sentMessage.delete()
                                break;

                            case '⏩':
                                if (page + 1 == buffer.length) break
                                page++
                                await sentMessage.edit(content())
                                break;

                            case '⏭️':
                                if (page == buffer.length - 1) break
                                page = buffer.length - 1
                                await sentMessage.edit(content())
                                break;
                        }
                    }

                collector.on('collect', pageMove)
                collector.on('remove', pageMove)
                collector.on('end', async () => {
                    try {
                        await sentMessage.reactions.removeAll()
                    } catch (error) {}
                })
            } catch (err) {
                const output = '```ts\n' + err + '```' + '```autohotkey\n::page 1/1```'
                const sentMessage = await message.channel.send(newEmbed().setDescription(output))
                await sentMessage.react('🆗')

                const collector = sentMessage.createReactionCollector(
                    (reaction, user) => user.id == message.author.id, 
                    { time: 60000, dispose: true }
                )

                const pageMove = 
                    async reaction => {
                        switch (reaction.emoji.name) {

                            case '🆗':
                                collector.stop()
                                await sentMessage.delete()
                                break;
                        }
                    }

                collector.on('collect', pageMove)
                collector.on('remove', pageMove)
                collector.on('end', async () => {
                    try {
                        await sentMessage.reactions.removeAll()
                    } catch (error) {}
                })
            }
            
        }
    }
]
export default commands