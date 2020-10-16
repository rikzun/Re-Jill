export { print, newEmbed, wait, randint, LocalTranslate, mth }
import { MessageEmbed } from 'discord.js'

declare global {
    interface String {
        endsWithAll(...symbols: string[]): boolean
        includesAll(...symbols: string[]): boolean
        indexOfAll(elem: string): number[]
        replaceIndex(index: number, replacement: string): string
        isNumber(): boolean
        matchf(regexp: RegExp): null | string[]
    }
    interface Date {
        strftime(format: string): string
    }
    interface Array<T> {
        add(elem: any, check?: any): this
        changeType(type: Function, force?: boolean): any[]
    }
}

String.prototype.endsWithAll = 
function (...symbols: string[]): boolean {
    for (let i = 0; i < symbols.length; i++) {
        if (this.endsWith(symbols[i])) return true
    }
    return false
}

String.prototype.replaceIndex = 
function(index: number, replacement: string): string {
    return this.substr(0, index) + replacement + this.substr(index + replacement.length)
}

String.prototype.indexOfAll = 
function (elem: string): number[] {
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

String.prototype.isNumber = 
function (): boolean {
    return /^\d+$/gm.test(this)
}

String.prototype.includesAll = 
function (...symbols: string[]): boolean {
    for (let i = 0; i < symbols.length; i++) {
        if (this.includes(symbols[i])) return true
    }
    return false
}

String.prototype.matchf = 
function (regexp: RegExp): null | string[] {
    return this.match(regexp)?.slice(1)
}

Date.prototype.strftime = 
function(format: string):string {
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

Array.prototype.add = 
function (elem: any, check: any = true): any[] {
    if (check) this.push(elem)
    return this
}

Array.prototype.changeType = 
function (type: Function, force: boolean = false): any[] {
  const arr = []
  for (const value of this) {
    if (force && !value?.isNumber()) { arr.push(value); continue}
    arr.push(type(value))
  }
  return arr
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

class LocalTranslate {
    data: object

    constructor(text: object) {
        this.data = text
    }

    translate(word: string): string {
        if (this.data.hasOwnProperty(word)) return this.data[word]
        return word
    }
}

function print(...data: any[]): void {
    data.forEach((val, key, map) =>
        console.log(val))
}

function randint(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1) + min)
}

function mth(a: number, operator: string, b: number): number {
    if (!a || !operator || !b) return undefined;
    switch (operator) {
        case '+': return a + b;
        case '-': return a - b;
        case '*': return a * b;
        case '/': return a / b;
        default: return undefined
    }
}