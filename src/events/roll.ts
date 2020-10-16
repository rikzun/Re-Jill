import { client } from '../bot'
import { Message } from 'discord.js'
import { print, newEmbed, randint, mth } from '../utils'

const rollRegexp = /^(\d*)?(?:d(\d+))(?: ?(=)?([+\-*/]) ?(?:(\d*)?(?:d?(\d+))?))?(?: ?_(\d+))?(?: ?([\s\S]*))?$/

client.on('message', async (message: Message) => {
    if (message.author.bot) return
    if (!rollRegexp.test(message.content)) return

    let [throws, edges, sumop, modSymbol, modNumber, modEdges, highlight, description] = message.content.matchf(rollRegexp).changeType(Number, true)
    let modDice = false

    if (throws == undefined) throws = 1
    if (modNumber == undefined && modEdges !== undefined) modNumber = 1
    if (modNumber !== undefined && modEdges !== undefined) modDice = true

    if (throws > 1000 || edges > 1000 || (modDice && (modEdges > 1000 || modNumber > 1000))) {
        message.react('❌')
        return
    }

    const line1: (string|number)[] = []
    let line1Sum = 0
    const line2: (string|number)[] = []
    let line2Sum = 0

    if (modDice) {
        let modDiceSum = 0
        for (let i = 0; i < modNumber; i++) {
            modDiceSum += randint(1, modEdges)
        }
        modNumber = modDiceSum
    }

    for (let i = 0; i < throws; i++) {
        let gen: number = randint(1, edges)
        let modf: number

        if (!sumop && modSymbol) modf = mth(gen, modSymbol, modNumber)

        if (modf !== undefined) {
            line1.push(modf)
            line1Sum += modf
            line2.push(gen)
            line2Sum += gen
            continue
        }

        line1.push(gen)
        line1Sum += gen
    }

    if (highlight !== undefined) {
        line1.forEach((v, i) => {
            if (v > highlight) line1[i] = `[${v}]`
        })
        line2.forEach((v, i) => {
            if (v > highlight) line2[i] = `[${v}]`
        })
    }
    
    if (sumop && modSymbol) line1Sum = mth(line1Sum, modSymbol, modNumber)

    const info = []
        .add(` [${line1Sum}]`, line1.length > 1 || sumop !== undefined)
        .add(` [${line2Sum}]`, line2.length > 1 || (sumop !== undefined && line2.length > 0))
        .add(` d[${modNumber}]`, modDice)

    const output = []
        .add(line1.join(' '), line1.length > 0)
        .add(line2.join(' '), line2.length > 0)

    const desc = (description ?? '') + '```\n' + output.join('\n') + '```'
    if (desc.length > 2000) {
        message.react('❌')
        return
    }

    const Embed = newEmbed()
        .setDescription(desc)
        .setAuthor(
            message.author.username + info.join(' '), 
            message.author.displayAvatarURL({format: 'png', dynamic: true, size: 4096})
        )

    await message.channel.send(Embed)
})