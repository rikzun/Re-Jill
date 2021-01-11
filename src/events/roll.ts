import { client } from '../bot'
import { Message } from 'discord.js'
import { print, newEmbed, randint } from '../utils'

const regexpRoll = /^(?:(\d*[.,]?\d+)?d(\d*[.,]?\d+))((?: ?=?[+\-*\/] ?(?:(?:\d*[.,]?\d+)?d?(?:\d*[.,]?\d+)))*)(?: ?_(>|>=|=|<=|<)(\d*[.,]?\d+))?(?: ([\s\S]*))?$/

class Roll {
    dNum: number
    dEdges: number
    mod: string
    hExp: string
    hNum: number
    text: string

    err: boolean

    sum: number
    numbers: number[]
    mods: RollMod[]
    output: string[]

    constructor(match: RegExpMatchArray) {
        this.dNum = Number(match[1])
        this.dEdges = Number(match[2])
        this.mod = match[3]
        this.hExp = match[4]
        this.hNum = Number(match[5])
        this.text = match[6]

        this.err = false

        if (Number.isNaN(this.dNum)) this.dNum = 1
        if (this.mod) this.mod = this.mod.replace(/\s+/g, '')

        this.sum = 0
        this.numbers = []
        this.mods = []
        this.output = []

        this.start()
    }

    start() {
        if (!this.dNum || !this.dEdges || this.dNum > 1000 || this.dEdges > 1000) { this.err = true; return }
        for (let i = 0; i < this.dNum; i++) {
            this.numbers.push(randint(1, this.dEdges))
        }

        if (this.mod) this.modCalculate()
        this.sum += this.numbers.reduce((p, c) => p + c)
        if (String(this.sum).split('.')[1]?.length > 3) this.sum = Number(this.sum.toFixed(3))

        for (let value of this.numbers) {
            if (String(value).split('.')[1]?.length > 3) value = Number(value.toFixed(3))
            if (this.hExp && this.compare(value, this.hExp, this.hNum)) { 
                this.output.push(`[${value}]`)
                continue
            }

            this.output.push(String(value))
        }
    }

    modCalculate() {
        const regexpMod = /(=?[+\-*\/])(?:(\d*[.,]?\d+)?d?(\d*[.,]?\d+)?)/g
        let match: RegExpMatchArray

        while ((match = regexpMod.exec(this.mod)) !== null) {
            if (match.index === regexpMod.lastIndex) regexpMod.lastIndex++

            this.mods.push(new RollMod(match))
        }

        for (const mod of this.mods) {
            if (mod.err) { this.err = true; return }
            if (mod.sum) { this.sum = this.mth(this.sum, mod.symbol, mod.value); continue }
            this.numbers.forEach((value, index) => {
                this.numbers[index] = this.mth(value, mod.symbol, mod.value)
            })
        }
    }

    mth(a: number, operator: string, b: number): number {
        switch (operator) {
            case '+': return a + b
            case '-': return a - b
            case '*': return a * b
            case '/': return a / b
        }
    }

    compare(a: number, operator: string, b: number): boolean {
        switch (operator) {
            case '>': return a > b
            case '>=': return a >= b
            case '=': return a == b
            case '<=': return a <= b
            case '<': return a < b
        }
    }

}

class RollMod {
    symbol: string
    value: number
    sum: boolean
    err: boolean

    constructor(match: RegExpMatchArray) {
        this.symbol = match[1]
        this.value = Number(match[2])
        this.sum = false
        this.err = false

        const dice = Number(match[3])
        if (!Number.isNaN(dice)) {
            if (Number.isNaN(this.value)) this.value = 1
            if (!dice || !this.value || dice > 1000 || this.value > 1000) { this.err = true; return }
            let sum = 0

            for (let i = 0; i < this.value; i++) {
                sum += randint(1, dice)
            }

            this.value = sum
        }

        if (this.symbol.includes('=')) {
            this.symbol.replace('=', '')
            this.sum = true
        }
    }
}

client.on('message', async (message: Message) => {
    if (message.author.bot) return
    if (!regexpRoll.test(message.content)) return

    const roll = new Roll(message.content.match(regexpRoll))
    const desc = '```css\n' + roll.output.join(' ') + '```'
    if (roll.err || desc.length > 2048) { message.react('❌'); return }

    const Embed = newEmbed()
        .setDescription(desc)
        .setFooter(roll.text ?? '')
        .setAuthor(
            `${message.author.username} [${roll.sum}]`,
            message.author.displayAvatarURL({format: 'png', dynamic: true, size: 4096})
        )

    await message.channel.send(Embed)
})