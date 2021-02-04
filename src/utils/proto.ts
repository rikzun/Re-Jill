import { randint } from './functions'

declare global {
    interface String {
        isNumber(): boolean
        indexOfAll(elem: string): number[]
        matchG(regexp: RegExp): RegExpMatchArray[]
    }
    interface Number {
        numsafterdot(): number
    }
    interface Array<T> {
        add(elem: any, check?: any): this
        randomKey(): number
        randomValue(): unknown
        empty: boolean
    }
    interface Object {
        randomKey(): string
        randomValue(): unknown
        empty: boolean
    }
}

Object.defineProperty(String.prototype, 'isNumber', {
    value: function() {
        return /^\d*\.?\d+$/gm.test(this)
    }
})

Object.defineProperty(String.prototype, 'indexOfAll', {
    value: function(elem: string):number[] {
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

Object.defineProperty(String.prototype, 'matchG', {
    value: function(regexp) {
        const arr = []
        for (let match = regexp.exec(this); true; match = regexp.exec(this)) {
            if (match == null || !regexp.global) break
            if (match.index == regexp.lastIndex) regexp.lastIndex++
            arr.push(match)
        }
        return arr
    }
})

Object.defineProperty(Number.prototype, 'numsafterdot', {
    value: function() {
        const [, fl] = String(this).split('.')
        return fl.length ?? 0
    }
})

Object.defineProperty(Array.prototype, 'add', {
    value: function(elem: any, check: any = true) {
        if (check) this.push(elem)
        return this
    }
})

Object.defineProperty(Array.prototype, 'randomKey', {
    value: function() {
        return randint(0, this.length - 1)
    }
})

Object.defineProperty(Array.prototype, 'randomValue', {
    value: function() {
        return this[randint(0, this.length - 1)]
    }
})

Object.defineProperty(Array.prototype, 'empty', {
    get: function() {
        return this.length == 0
    }
})

Object.defineProperty(Object.prototype, 'randomKey', {
    value: function() {
        const keys = Object.keys(this)
        return keys[randint(0, keys.length - 1)]
    }
})

Object.defineProperty(Object.prototype, 'randomValue', {
    value: function() {
        const values = Object.values(this)
        return values[randint(0, values.length - 1)]
    }
})

Object.defineProperty(Object.prototype, 'empty', {
    get: function() {
        return Object.keys(this).length == 0
    }
})