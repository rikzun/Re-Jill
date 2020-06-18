import { Message } from "discord.js"
export {
    print, randint, wordTransfer, 
    get, arrayDelValue, range, mth, 
    }

function print(...data: any[]) {
    data.forEach((val, key, map) =>
        console.log(val))
}

function randint(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1) + min)
}

function wordTransfer(obj) {
    try {
        obj = obj.split(' ')
    } catch (error) {
        return null
    }
    
    let rt = ''
    let i = 1
    obj.forEach(v => {
        if (i == 3) {
        rt += v + '\n'
        i = 0
        } else {
        rt += v + ' '
        }
        i++
    })
    return rt
}

function get(dict: object, key: string, rt:any = {}) {
    return dict?.[key] ?? rt
}

function arrayDelValue(array: Array<any>, value: string) {
    const index = array.indexOf(value)
    array.splice(index, 1)
    return array
}

function range(min: number, max: number) {
    return Array.apply(0, Array(max))
        .map((element, index) => index + min);
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