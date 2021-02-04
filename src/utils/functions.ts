export { wait, randint, strftime }

function wait(ms: number): Promise<Function> {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

function randint(min: number, max: number): number {
    if (min > max || min < 0) return 0
    return Math.floor(Math.random() * (max - min + 1) + min)
}

function strftime(num: number, format: string): string {
    const date = new Date(num < 0 ? 0 : num)

    const matches = format.match(/%(d|m|y|H|M|S)/g)
    const dtfunc = {
        'd': date.getUTCDate(),
        'm': date.getUTCMonth() + 1,
        'y': date.getUTCFullYear(),
        'H': date.getUTCHours(),
        'M': date.getUTCMinutes(),
        'S': date.getUTCSeconds(),
    }

    matches.forEach(e => {
        let value = dtfunc[e.replace('%', '')]
        if (value < 10) value = `0${value}`
  
        format = format.replace(e, value)
    })

    return format
}