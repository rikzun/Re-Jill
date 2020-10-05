export { print, newEmbed, wait, randint }
import { MessageEmbed } from 'discord.js'

declare global {
    interface String {
        endsWithAll(...symbols: string[]): boolean
        includesAll(...symbols: string[]): boolean
        indexOfAll(elem: string): number[]
        replaceIndex(index: number, replacement: string): string
        isNumber(): boolean
    }
    interface Date {
        strftime(format: string): string
    }
    interface Array<T> {
        add(elem: any, check?: any): this
    }
}

String.prototype.endsWithAll = function (...symbols: string[]): boolean {
    for (let i = 0; i < symbols.length; i++) {
        if (this.endsWith(symbols[i])) return true
    }
    return false
}

String.prototype.replaceIndex = function(index: number, replacement: string): string {
    return this.substr(0, index) + replacement + this.substr(index + replacement.length)
}

String.prototype.indexOfAll = function (elem: string): number[] {
    let text = this.repeat(1)
    const amount = text.match(new RegExp(elem, 'g')).length
    const indices = []
    for (let i = 0; i < amount; i++) {
        const index = text.indexOf(elem)
        indices.push(index)
        text = text.replaceIndex(index, ' '.repeat(elem.length))
    }
    
    return indices
}

String.prototype.isNumber = function (): boolean {
    return /^\d+$/gm.test(this)
}

String.prototype.includesAll = function (...symbols: string[]): boolean {
    for (let i = 0; i < symbols.length; i++) {
        if (this.includes(symbols[i])) return true
    }
    return false
}

Date.prototype.strftime = function(format: string):string {
    let date = this
    if (date < 0) date = 0

    const matches = format.match(/%(d|m|y|H|M|S)/g)
    const dtfunc = {
        'd': new Date(date).getUTCDate(),
        'm': new Date(date).getUTCMonth() + 1,
        'y': new Date(date).getUTCFullYear(),
        'H': new Date(date).getUTCHours(),
        'M': new Date(date).getUTCMinutes(),
        'S': new Date(date).getUTCSeconds(),
    }

    matches.forEach(e => {
        let value = dtfunc[e.replace('%', '')]
        if (value < 10) {
          value = `0${value}`
        }
  
        format = format.replace(e, value)
    })

    return format
}

Array.prototype.add = function (elem: any, check: any = true): any[] {
    if (check) this.push(elem)
    return this
}

// --------------------
//  end prototype adds
// --------------------

function newEmbed(): MessageEmbed {
    return new MessageEmbed().setColor('#2F3136')
}

function wait(ms: number): Promise<Function> {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

function print(...data: any[]): void {
    data.forEach((val, key, map) =>
        console.log(val))
}

function randint(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1) + min)
}