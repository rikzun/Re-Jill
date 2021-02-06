import { GuildEmoji } from 'discord.js'
import { client } from '../bot'

export let emojis: GuildEmoji[] = []

async function emoijCallback(eventType: string, firstEmoji?: GuildEmoji, secondEmoji?: GuildEmoji): Promise<void> {
    switch (eventType) {
        case 'ready': {
            for (const emoji of client.emojis.cache.values()) emojis.push(emoji)
            break
        }

        case 'emojiCreate': {
            emojis.push(firstEmoji)
            break
        }

        case 'emojiDelete': {
            const index = emojis.indexOf(firstEmoji)
            if (index >= 0) emojis.splice(index, 1)
            break
        }

        case 'emojiUpdate': {
            const index = emojis.indexOf(firstEmoji)
            if (index >= 0) emojis.splice(index, 1)
            
            emojis.push(secondEmoji)
            break
        }
    }
}

client.on('ready', async()=>{ emoijCallback('ready') })
client.on('emojiCreate', async(emoji: GuildEmoji)=>{ emoijCallback('emojiCreate', emoji) })
client.on('emojiDelete', async(emoji: GuildEmoji)=>{ emoijCallback('emojiDelete', emoji) })
client.on('emojiUpdate', async(oldEmoji: GuildEmoji, newEmoji: GuildEmoji)=>{ emoijCallback('emojiUpdate', oldEmoji, newEmoji) })