export {print, randint, wordTransfer}

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