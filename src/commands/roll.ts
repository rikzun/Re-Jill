import {Message, MessageEmbed} from 'discord.js'
import {print, mth, randint} from '../py'

module.exports = {
    'roll': async (message: Message, args: string[]) => {
        if (Number(args[1]) > 500 || Number(args[2]) > 10000) return;
        if (!args[1] || Number(args[1]) < 1) {
            args[1] = '1'
        }
        let first: (string|number)[] = [],
            second: (string|number)[] = []

        for (let i = Number(args[1]); i > 0; i--) {
            let genNum: number | string = randint(0, Number(args[2]))
            let mod: number | string = mth(genNum, args[3], Number(args[4]))
            let highlight: number

            if (args[5]) {
                highlight = Number(args[5].replace('_', ''))
            }

            if (genNum >= highlight) {
                genNum = '[' + genNum + ']'
            }
            if (mod >= highlight) {
                mod = '[' + mod + ']'
            }

            if (mod) {
                first.push(mod)
                second.push(genNum)
                continue
            }

            first.push(genNum)
        }

        let onlyNums: number[] = []
        for (let i = first.length - 1; i > -1; i--) {
            let value = first[i]
            if (typeof first[i] == 'string') {
                value = String(first[i]).replace('[', '').replace(']', '')
            }
            onlyNums.push(Number(value))
        }
        const reducer = (accumulator, currentValue) => accumulator + currentValue
        const sum = '[' + onlyNums.reduce(reducer) + ']'
            

        let text = args[6] ?? ''
        if (first.length) {
            text += '```\n' + first.join(' ')
        }
        if (second.length) {
            text += '\n' + second.join(' ')
        }
        text += '```'

        if (text.length > 1024) {
            message.react('❌')
            return
        }

        const embedMessage = new MessageEmbed()
            .addField(`${message.author.username} ${sum}`, text)
        
        message.channel.send(embedMessage)
    }
}