import { randint } from './functions'

declare global {
    interface String {
        isNumber: boolean
        ssplit(separator: string): string[]
    }
    interface Number {
        numsafterdot(): number
    }
    interface Array<T> {
        randomKey(): number
        randomValue(): unknown
        empty: boolean
        add(elem1: unknown, bool?: unknown, elem2?: unknown): this
        delValue(...items: unknown[]): void
    }
    interface Object {
        randomKey(): unknown
        randomValue(): unknown
        empty: boolean,
        getKeyByValue(value: string | number | symbol): unknown | null
        withoutProps(...items: (string | number | symbol)[]): this
    }
}

Object.defineProperty(String.prototype, 'isNumber', {
    get: function(): boolean {
        return /^\d*\.?\d+$/gm.test(this)
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

Object.defineProperty(Array.prototype, 'add', {
    value: function(elem1: unknown, bool: unknown = true, elem2: unknown) {
        if (bool) { this.push(elem1) }
        else if (elem2) this.push(elem2)
        return this
    }
})

Object.defineProperty(Array.prototype, 'delValue', {
    value: function(...items: unknown[]): void {
        for (const item of items) {
            const index = this.findIndex(v => v === item)
            if (index < 0) continue

            this.splice(index, 1)
        }
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
    value: function(value: string | number | symbol): unknown | null {
        return Object.keys(this).find(key => this[key] === value) ?? null
    }
})

Object.defineProperty(Object.prototype, 'withoutProps', {
    value: function(...items: (string | number | symbol)[]) {
        const object: Object = Object.assign(this)
        for (const property of items) delete object[property]
        return object
    }
})