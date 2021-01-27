import { client } from '../bot'
import { Message } from 'discord.js'
import { print, newEmbed, randint } from '../utils'

const regexpRoll = /^(?:(\d*)?d(\d*))(?: ?\((\d*)\))?((?: ?=?[+\-*\/] ?(?:(?:\d*)?d?(?:\d*.?\d+)))*)(?: ?_(>|>=|=|<=|<)(\d*\.?\d+))?(?: ([\s\S]*))?$/
const regexpMod = /(=?[+\-*\/])(?:(?:(\d*)d)?(\d*\.?\d+)?)/g

class Roll {
    dNumber: number
    dEdges: number
    repeat: number
    mod: string
    hSymbol: string
    hNumber: number
    text: string

    arr: number[][]
    output: string[][]
    lastMod: {symbol: string, value: number}[]
    sum: number[]
    hgtlsum: number[]

    error: boolean

    constructor(match: RegExpMatchArray) {
        this.dNumber = Number(match[1] ?? 1)
        this.dEdges = Number(match[2] ?? 0)
        this.repeat = Number(match[3] ?? 1)
        this.mod = match[4]
        this.hSymbol = match[5]
        this.hNumber = Number(match[6])
        this.text = match[7]

        this.arr = []
        this.output = []
        this.lastMod = []
        this.sum = []
        this.hgtlsum = []

        this.mod = this.mod.replace(/\s+/g, '')
        this.start()
    }

    start() {
        if (!this.dNumber || !this.dEdges || this.dNumber > 1000 || this.dEdges > 1000|| this.repeat > 20) { this.error = true; return }

        this.gen()
        if (this.mod) this.modCalculate()
        this.massRound()
        this.sumCalculate()
        this.end()
    }

    gen() {
        for (let ii = 0; ii < this.repeat; ii++) {
            this.arr.push([])

            for (let i = 0; i < this.dNumber; i++) {
                this.arr[ii].push(randint(1, this.dEdges))
            }
        }
    }

    modCalculate() {
        const mods = []
        let match: RegExpMatchArray

        class RollMod {
            symbol: string
            value: number
            sum: boolean
            error: boolean

            constructor(match: RegExpMatchArray) {
                this.symbol = match[1]
                this.value = Number(match[3])
                this.sum = false
                this.error = false
            
                const dice = Math.floor(Number(match[2]))
                if (!Number.isNaN(dice)) {
                    if (Number.isNaN(this.value)) this.value = 1
                    if (!dice || !this.value || dice > 1000 || this.value > 1000) { this.error = true; return }
                    let sum = 0
                
                    for (let i = 0; i < this.value; i++) {
                        sum += randint(1, dice)
                    }
                
                    this.value = sum
                }
            
                if (this.symbol.startsWith('=')) {
                    this.symbol = this.symbol.replace('=', '')
                    this.sum = true
                }
            }
        }

        while ((match = regexpMod.exec(this.mod)) !== null) {
            if (match.index === regexpMod.lastIndex) regexpMod.lastIndex++

            mods.push(new RollMod(match))
        }

        for (const mod of mods) {
            for (let i = 0; i < this.repeat; i++) {
                if (mod.error) { this.error = true; return }
                if (mod.sum) {
                    delete mod.sum
                    delete mod.error

                    this.lastMod.push(mod)
                    continue
                }

                for (const [index, value] of this.arr[i].entries()) {
                    this.arr[i][index] = this.mth(value, mod.symbol, mod.value)
                }
            }
        }
    }

    massRound() {
        for (let i = 0; i < this.repeat; i++) {
            for (const [index, value] of this.arr[i].entries()) {
                const [int, fl] = String(value).split('.')

                if (fl?.length > 3) {
                    this.arr[i][index] = Number(int + '.' + fl.slice(0, 3))
                }
            }
        }
    }

    sumCalculate() {
        for (let i = 0; i < this.repeat; i++) {
            let sum = this.arr[i].reduce((p, c) => p + c)

            const [, fl] = String(sum).split('.')
            if (fl?.length > 3) sum = Number(sum.toFixed(3))

            this.sum.push(sum)

            for (const mod of this.lastMod) {
                this.sum[i] = this.mth(this.sum[i], mod.symbol, mod.value)
            }
        }
    }

    end() {
        for (let i = 0; i < this.repeat; i++) {
            this.output.push([])
            this.hgtlsum.push(0)

            for (const number of this.arr[i]) {
                let num = String(number)

                if (this.hSymbol && this.compare(number, this.hSymbol, this.hNumber)) {
                    this.hgtlsum[i]++
                    num = `[${number}]`
                }
                this.output[i].push(num)
            }
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


client.on('message', async (message: Message) => {
    if (message.author.bot) return
    if (!regexpRoll.test(message.content)) return

    const roll = new Roll(message.content.match(regexpRoll))
    if (roll.error) { message.react('❌'); return }

    let author = message.author.username
    for (let i = 0; i < roll.repeat; i++) {
        if (roll.dNumber > 1 || roll.lastMod.length > 0) author += ` +${roll.sum[i]}`
        if (roll.hSymbol) author += ` [${roll.hgtlsum[i]}]`
    }

    let desc = ''
    for (let i = 0; i < roll.repeat; i++) {
        desc += '```css\n' + roll.output[i].join(' ') + '```'
    }

    if (desc.length > 2048) desc = desc.slice(0, 2042) + '...```'
    if (author.length > 256) author = author.slice(0, 253) + '...'

    const Embed = newEmbed()
        .setDescription(desc)
        .setFooter(roll.text ?? '')
        .setAuthor(author, message.author.displayAvatarURL({format: 'png', dynamic: true, size: 4096}))
    
    await message.channel.send(Embed)
})