import {Message, MessageEmbed} from 'discord.js'
import {print, mth, randint} from '../py'

module.exports = [
    {
        names: ['roll'],
        args: ['string[]'],
        run: async (message: Message, code: string[]) => {
            if (Number(code[0]) > 500 || Number(code[1]) > 10000) return;

            //missing #d
            if (!code[0] || Number(code[0]) < 1) {
                code[0] = '1'
            }
    
            //first - модифицированное число, second - оригинал (при отстутсвии мода first - оригинал)
            let first: (string|number)[] = [],
                second: (string|number)[] = [],
                highlightFirst = 0,
                highlightSecond = 0
    
            //генерация чисел
            for (let i = Number(code[0]); i > 0; i--) {
                let genNum: number | string = randint(1, Number(code[1])) //сгенерированное число
                let mod: number | string = mth(genNum, code[2], Number(code[3])) //модифицированное число
                let highlight: number //число для выделения
    
                if (code[4]) {
                    highlight = Number(code[4].replace('_', ''))
                }

                //выделение чисел
                if (mod >= highlight) {
                    mod = '[' + mod + ']'
                    highlightFirst++
                }

                if (genNum >= highlight) {
                    genNum = '[' + genNum + ']'
                    highlightSecond++
                }
    
                if (mod !== 'undefined') {
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
            let text = code[5] ?? ''
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
            if (highlightFirst) {
                highlightCout += `_${highlightFirst} `
            }
            if (highlightSecond) {
                highlightCout += `_${highlightSecond}`
            }
    
            const embedMessage = new MessageEmbed()
                .addField(`${message.author.username} ${sum} ${highlightCout}`, text)
            
            message.channel.send(embedMessage)
        }
    },
]