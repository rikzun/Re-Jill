import { split } from 'ts-node'
import { randint } from './functions'

declare global {
    interface String {
        isNumber: boolean
        indexOfAll(elem: string): number[]
        matchAll(regexp: RegExp): RegExpMatchArray[]
        ssplit(separator: string): string[]
    }
    interface Number {
        numsafterdot(): number
    }
    interface Array<T> {
        add(elem1: unknown, bool?: unknown, elem2?:unknown): this
        randomKey(): number
        randomValue(): unknown
        empty: boolean
    }
    interface Object {
        randomKey(): string
        randomValue(): unknown
        empty: boolean,
        getKeyByValue(value: unknown): string
    }
}

Object.defineProperty(String.prototype, 'isNumber', {
    get: function(): boolean {
        return /^\d*\.?\d+$/gm.test(this)
    }
})

Object.defineProperty(String.prototype, 'indexOfAll', {
    value: function(elem: string): number[] {
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
})

Object.defineProperty(String.prototype, 'matchAll', {
    value: function(regexp: RegExp): RegExpMatchArray[] {
        const arr = []
        for (let match = regexp.exec(this); true; match = regexp.exec(this)) {
            if (match == null || !regexp.global) break
            if (match.index == regexp.lastIndex) regexp.lastIndex++
            arr.push(match)
        }
        return arr
    }
})

Object.defineProperty(String.prototype, 'ssplit', {
    value: function(separator: string): string[] {
        const split = this.split(separator)
        const rt = []

        for (let i = 0; i < split.length; i++) {
            const rtv = [separator, split[i]]
            if (i == 0) rtv.shift()
            rt.push(...rtv)
        }
        return rt
    }
})

Object.defineProperty(Number.prototype, 'numsafterdot', {
    value: function(): number {
        const [, fl] = String(this).split('.')
        return fl.length ?? 0
    }
})

Object.defineProperty(Array.prototype, 'add', {
    value: function(elem1: unknown, bool: unknown = true, elem2: unknown) {
        if (bool) {
            this.push(elem1)
        } else if(elem2) this.push(elem2)
        return this
    }
})

Object.defineProperty(Array.prototype, 'randomKey', {
    value: function(): number {
        return randint(0, this.length - 1)
    }
})

Object.defineProperty(Array.prototype, 'randomValue', {
    value: function(): unknown {
        return this[randint(0, this.length - 1)]
    }
})

Object.defineProperty(Array.prototype, 'empty', {
    get: function(): boolean {
        return this.length == 0
    }
})

Object.defineProperty(Object.prototype, 'randomKey', {
    value: function(): string {
        const keys = Object.keys(this)
        return keys[randint(0, keys.length - 1)]
    }
})

Object.defineProperty(Object.prototype, 'randomValue', {
    value: function(): unknown {
        const values = Object.values(this)
        return values[randint(0, values.length - 1)]
    }
})

Object.defineProperty(Object.prototype, 'empty', {
    get: function(): boolean {
        return Object.keys(this).length == 0
    }
})

Object.defineProperty(Object.prototype, 'getKeyByValue', {
    value: function(value: unknown): string {
        return Object.keys(this).find(key => this[key] === value) ?? ''
    }
})