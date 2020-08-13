import {client, CommandFile} from '../bot'
import {Message, MessageEmbed} from 'discord.js'
import {print, mth, randint} from '../py'

const commands: CommandFile[] = [
    {
        names: ['roll'],
        regexp: {exp: /^(\d*)?d(\d+)([-+*/])?(\d+)?( _\d+)?( .+)?/im, only: true, output: 'roll {} {} {} {}{}{}'},
        args: {diceCount: 'number', diceSize: 'number', modSymbol: '', modNumber: 'number', highlight: '', 'description*': ''},
        run: async (message: Message, diceCount: number = 1, diceSize: number, modSymbol: string, modNumber: number, highlight: number, description: string) => {
            if (diceCount > 500 || diceSize > 1000) {
                message.react('❌')
                return
            }
    
            let line1: (string|number)[] = [],
                line1hl: number = 0,
                line1sum: number = 0,
                line2: (string|number)[] = [],
                line2hl: number = 0

            if (highlight !== undefined) highlight = Number(String(highlight).replace('_', ''))
    
            //number gen
            for (let i = diceCount; i > 0; i--) {
                const generated: number = randint(1, diceSize)

                if (!(modSymbol && (typeof modNumber !== 'undefined'))) {
                    line1sum += generated
                    if (highlight) {
                        if (generated >= highlight) {
                            line1.push(`[${generated}]`)
                            line1hl++
                        } else {
                            line1.push(generated)
                        }

                    } else {
                        line1.push(generated)
                    }

                } else {
                    const modificated = mth(generated, modSymbol, modNumber)
                    line1sum += modificated

                    if (highlight) {

                        if (modificated >= highlight) {
                            line1.push(`[${modificated}]`)
                            line1hl++
                        } else {
                            line1.push(modificated)
                        }

                        if (generated >= highlight) {
                            line2.push(`[${generated}]`)
                            line2hl++
                        } else {
                            line2.push(generated)
                        }
                        
                    } else {
                        line1.push(modificated)
                        line2.push(generated)
                    }
                }
            }

            if (description) {
                description += '\n'
            }

            let allHighlight = '',
                text = ''

            if (line1.length > 0) {
                text += `${line1.join(' ')}`
            }
            if (line2.length > 0) {
                text += `\n${line2.join(' ')}`
            }

            text = (description ?? '') + '```\n' + text + '```'

            if (text.length > 1024) {
                message.react('❌')
                return
            }

            if (line1hl > 0) {
                allHighlight += `_${line1hl}`
            }
            if (line2hl > 0) {
                allHighlight += ` _${line2hl}`
            }
    
            const embedMessage = new MessageEmbed()
                .addField(`${message.author.username} [${line1sum}] ${allHighlight}`, text)
            
            message.channel.send(embedMessage)
        }
    },
]
export default commands