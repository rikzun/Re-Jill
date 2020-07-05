import {Message, MessageEmbed} from 'discord.js'
import {print, mth, randint} from '../py'

module.exports = {
    'roll': async (message: Message, args: string[]) => {
        if (Number(args[1]) > 500 || Number(args[2]) > 10000) return; //ограничение

        //отсутствие #d
        if (!args[1] || Number(args[1]) < 1) {
            args[1] = '1'
        }

        //first - модифицированное число, second - оригинал (при отстутсвии мода first - оригинал)
        let first: (string|number)[] = [],
            second: (string|number)[] = [],
            highlightSum1 = 0,
            highlightSum2 = 0

        //генерация чисел
        for (let i = Number(args[1]); i > 0; i--) {
            let genNum: number | string = randint(1, Number(args[2])) //сгенерированное число
            let mod: number | string = mth(genNum, args[3], Number(args[4])) //модифицированное число
            let highlight: number //число для выделения

            if (args[5]) {
                highlight = Number(args[5].replace('_', ''))
            }

            //выделение чисел
            if (genNum >= highlight) {
                genNum = '[' + genNum + ']'
                highlightSum1++
            }
            if (mod >= highlight) {
                mod = '[' + mod + ']'
                highlightSum2++
            }

            if (mod || mod == 0) {
                first.push(mod)
                second.push(genNum)
                continue
            }

            first.push(genNum)
        }

        //подсчитывание суммы чисел
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
            
        //собираем текст
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

        let highlightCout = ''
        if (highlightSum1) {
            highlightCout += `_${highlightSum1} `
        }
        if (highlightSum2) {
            highlightCout += `_${highlightSum2}`
        }

        const embedMessage = new MessageEmbed()
            .addField(`${message.author.username} ${sum} ${highlightCout}`, text)
        
        message.channel.send(embedMessage)
    }
}